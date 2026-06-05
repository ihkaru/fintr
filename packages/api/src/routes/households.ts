import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { households, householdMembers, users } from "../db/schema";
import { eq } from "drizzle-orm";

export const householdRoutes = new Elysia({ prefix: "/households" })
  .use(authMiddleware)
  .get("/", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 404;
      return { error: "Belum tergabung di rumah tangga manapun" };
    }

    const [household] = await db.select().from(households).where(eq(households.id, householdId));

    const members = await db
      .select({
        userId: householdMembers.userId,
        role: householdMembers.role,
        joinedAt: householdMembers.joinedAt,
        name: users.name,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(eq(householdMembers.householdId, householdId));

    return { household, members };
  })
  .patch(
    "/",
    async ({ householdId, body, set, role }) => {
      if (!householdId) {
        set.status = 404;
        return { error: "Belum tergabung di rumah tangga manapun" };
      }

      if (role !== "owner") {
        set.status = 403;
        return { error: "Hanya owner yang bisa mengubah data rumah tangga" };
      }

      const [updated] = await db
        .update(households)
        .set({ name: body.name })
        .where(eq(households.id, householdId))
        .returning();

      return updated;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    }
  )
  .get("/invite-code", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 404;
      return { error: "Belum tergabung di rumah tangga manapun" };
    }

    const [household] = await db
      .select({ inviteCode: households.inviteCode })
      .from(households)
      .where(eq(households.id, householdId));

    return { inviteCode: household.inviteCode };
  });
