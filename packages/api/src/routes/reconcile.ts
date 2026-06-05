import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { accountSnapshots, budgetPeriods, transactions } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const reconcileRoutes = new Elysia({ prefix: "/reconcile" })
  .use(authMiddleware)
  .post(
    "/snapshot",
    async ({ body, userId, householdId, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      const [snapshot] = await db
        .insert(accountSnapshots)
        .values({
          householdId,
          createdBy: userId,
          actualBalance: body.actualBalance.toString(),
          note: body.note || null,
          snapshotAt: body.snapshotAt ? new Date(body.snapshotAt) : new Date(),
        })
        .returning();

      return snapshot;
    },
    {
      body: t.Object({
        actualBalance: t.Number(),
        note: t.Optional(t.String()),
        snapshotAt: t.Optional(t.String()),
      }),
    }
  )
  .get("/diff", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    // Get the current (latest open) period
    const [currentPeriod] = await db
      .select()
      .from(budgetPeriods)
      .where(and(eq(budgetPeriods.householdId, householdId), eq(budgetPeriods.isClosed, false)))
      .orderBy(desc(budgetPeriods.year), desc(budgetPeriods.month))
      .limit(1);

    if (!currentPeriod) {
      set.status = 404;
      return { error: "Tidak ada periode aktif" };
    }

    // Get total spent in current period
    const [spentResult] = await db
      .select({
        totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.periodId, currentPeriod.id));

    const totalSpent = parseFloat(spentResult.totalSpent);
    const openingBalance = parseFloat(currentPeriod.openingBalance || "0");

    // Get the latest snapshot
    const [latestSnapshot] = await db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.householdId, householdId))
      .orderBy(desc(accountSnapshots.snapshotAt))
      .limit(1);

    const expectedBalance = openingBalance - totalSpent;
    const actualBalance = latestSnapshot ? parseFloat(latestSnapshot.actualBalance) : null;
    const difference = actualBalance !== null ? actualBalance - expectedBalance : null;

    return {
      period: {
        year: currentPeriod.year,
        month: currentPeriod.month,
      },
      openingBalance: openingBalance.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      expectedBalance: expectedBalance.toFixed(2),
      actualBalance: actualBalance?.toFixed(2) || null,
      difference: difference?.toFixed(2) || null,
      lastSnapshot: latestSnapshot || null,
      status:
        difference === null ? "no_snapshot" : Math.abs(difference) < 10000 ? "ok" : "needs_review",
    };
  })
  .get("/history", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    const snapshots = await db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.householdId, householdId))
      .orderBy(desc(accountSnapshots.snapshotAt))
      .limit(20);

    return snapshots;
  });
