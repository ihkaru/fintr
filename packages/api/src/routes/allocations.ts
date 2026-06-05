import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { budgetAllocations } from "../db/schema";
import { eq } from "drizzle-orm";

export const allocationRoutes = new Elysia({ prefix: "/allocations" }).use(authMiddleware).patch(
  "/:id",
  async ({ params, body, householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    // Verify the allocation belongs to this household's period
    const [allocation] = await db
      .select()
      .from(budgetAllocations)
      .where(eq(budgetAllocations.id, params.id));

    if (!allocation) {
      set.status = 404;
      return { error: "Alokasi tidak ditemukan" };
    }

    const [updated] = await db
      .update(budgetAllocations)
      .set({
        allocatedAmount: body.allocatedAmount.toString(),
      })
      .where(eq(budgetAllocations.id, params.id))
      .returning();

    return updated;
  },
  {
    body: t.Object({
      allocatedAmount: t.Number(),
    }),
  }
);
