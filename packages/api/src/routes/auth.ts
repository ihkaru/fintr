import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db/index";
import { users, households, householdMembers, transactions } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyGoogleToken } from "../services/google-auth";
import { seedDefaultEnvelopes, seedInitialPeriod } from "../db/seed";
import fs from "node:fs";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-me",
      exp: "30d",
    })
  )
  .get("/config", () => {
    return {
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    };
  })
  .post(
    "/google",
    async ({ body, jwt }) => {
      // 1. Verify Google ID token
      let googleUser;
      if (body.idToken === "demo-token") {
        googleUser = {
          sub: "demo-google-sub-123456",
          email: "demo-user@fintr.local",
          name: "Ihsan BPS",
          picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        };
      } else {
        googleUser = await verifyGoogleToken(body.idToken);
      }

      // Download Google profile picture to save locally and avoid browser 429
      let localAvatarUrl = googleUser.picture;
      if (googleUser.picture && !googleUser.picture.includes("default-user")) {
        try {
          const res = await fetch(googleUser.picture);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            const avatarsDir = "public/avatars";
            if (!fs.existsSync(avatarsDir)) {
              fs.mkdirSync(avatarsDir, { recursive: true });
            }
            const filename = `${googleUser.sub}.jpg`;
            fs.writeFileSync(`${avatarsDir}/${filename}`, Buffer.from(buffer));
            localAvatarUrl = `/api/public/avatars/${filename}`;
          }
        } catch (err) {
          console.error("Gagal menyimpan avatar lokal dari Google:", err);
        }
      }

      // 2. Upsert user
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.googleSub, googleUser.sub));

      let user;
      if (existingUsers.length > 0) {
        // Update profile info from Google
        [user] = await db
          .update(users)
          .set({
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: localAvatarUrl,
          })
          .where(eq(users.googleSub, googleUser.sub))
          .returning();
      } else {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            googleSub: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: localAvatarUrl,
          })
          .returning();

        // Auto-create household for new user
        const [household] = await db
          .insert(households)
          .values({
            name: `Keluarga ${googleUser.name.split(" ")[0]}`,
            inviteCode: generateInviteCode(),
          })
          .returning();

        // Add user as owner
        await db.insert(householdMembers).values({
          householdId: household.id,
          userId: user.id,
          role: "owner",
        });

        // Seed default envelopes
        await seedDefaultEnvelopes(household.id);

        // Create initial period (defaults to current month and year)
        await seedInitialPeriod(household.id);
      }

      // 3. Get household membership
      const [membership] = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, user.id));

      // 4. Issue JWT
      const token = await jwt.sign({
        sub: user.id,
        email: user.email,
        householdId: membership?.householdId,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        household: membership ? { id: membership.householdId, role: membership.role } : null,
      };
    },
    {
      body: t.Object({
        idToken: t.String(),
      }),
    }
  )
  .post(
    "/join-household",
    async ({ body, jwt, bearer, set }) => {
      // Verify JWT
      if (!bearer) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const payload = await jwt.verify(bearer);
      if (!payload) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      const userId = payload.sub as string;

      // Find household by invite code
      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.inviteCode, body.inviteCode));

      if (!household) {
        set.status = 404;
        return { error: "Kode undangan tidak ditemukan" };
      }

      // Check if already a member
      const existing = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, userId));

      if (existing.length > 0 && existing[0].householdId === household.id) {
        return { message: "Sudah tergabung di rumah tangga ini" };
      }

      // Prevent joining another household if they already have transaction history
      const [userTxCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(eq(transactions.createdBy, userId));

      if (userTxCount && userTxCount.count > 0) {
        if (body.forceDeleteTransactions) {
          // Delete all transactions created by this user
          await db.delete(transactions).where(eq(transactions.createdBy, userId));
        } else {
          set.status = 400;
          return {
            success: false,
            code: "HOUSEHOLD_JOIN_BLOCKED_EXISTING_DATA",
            message:
              "Tidak dapat bergabung ke rumah tangga baru karena Anda sudah memiliki catatan transaksi pada rumah tangga saat ini.",
            details: {
              existingTransactionsCount: userTxCount.count,
            },
          };
        }
      }

      // Remove from current household if any
      if (existing.length > 0) {
        const oldHouseholdId = existing[0].householdId;
        await db.delete(householdMembers).where(eq(householdMembers.userId, userId));

        // Check if there are any members left in the old household
        const remainingMembers = await db
          .select()
          .from(householdMembers)
          .where(eq(householdMembers.householdId, oldHouseholdId));

        if (remainingMembers.length === 0) {
          // Delete the old household entirely to prevent orphan/ghost households
          await db.delete(households).where(eq(households.id, oldHouseholdId));
          console.log(`[Auth] Empty household ${oldHouseholdId} deleted successfully.`);
        }
      }

      // Join the household
      await db.insert(householdMembers).values({
        householdId: household.id,
        userId,
        role: "member",
      });

      return {
        message: "Berhasil bergabung",
        household: { id: household.id, name: household.name },
      };
    },
    {
      body: t.Object({
        inviteCode: t.String(),
        forceDeleteTransactions: t.Optional(t.Boolean()),
      }),
    }
  );

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
