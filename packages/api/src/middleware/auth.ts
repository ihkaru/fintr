import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db/index";
import { householdMembers } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Auth middleware plugin for ElysiaJS.
 * Extracts and verifies JWT from Bearer token,
 * then resolves the user's household context.
 */
export const authMiddleware = new Elysia({ name: "auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "dev-secret-change-me",
      exp: "30d",
    })
  )
  .use(bearer())
  .derive({ as: "scoped" }, async ({ jwt, bearer, query, set }) => {
    const token = bearer || (query as Record<string, string | undefined>)?.token;
    if (!token) {
      set.status = 401;
      throw new Error("Unauthorized: No token provided");
    }

    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Unauthorized: Invalid token");
    }

    const userId = payload.sub as string;

    // Get user's household membership
    const membership = await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId))
      .limit(1);

    const householdId = membership[0]?.householdId || null;
    const role = membership[0]?.role || null;

    return {
      userId,
      householdId,
      role,
    };
  });
