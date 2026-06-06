import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { transactions, budgetPeriods } from "../../db/schema";
import { eq } from "drizzle-orm";
import { broadcastToHousehold } from "../../services/sync";
import { authMiddleware } from "../../middleware/auth";

export const deleteRoute = new Elysia()
  .use(authMiddleware)
  .patch(
    "/:id",
    async ({ params, body, userId, householdId, set }) => {
      const [existingTxn] = await db
        .select({ periodId: transactions.periodId })
        .from(transactions)
        .where(eq(transactions.id, params.id));

      if (!existingTxn) {
        set.status = 404;
        return { error: "Transaksi tidak ditemukan" };
      }

      // Check if period is closed
      const [period] = await db
        .select({ isClosed: budgetPeriods.isClosed })
        .from(budgetPeriods)
        .where(eq(budgetPeriods.id, existingTxn.periodId));

      if (period?.isClosed) {
        set.status = 400;
        return { error: "PERIOD_CLOSED" };
      }

      const updates: Record<string, unknown> = {};
      if (body.amount !== undefined) updates.amount = body.amount.toString();
      if (body.merchant !== undefined) updates.merchant = body.merchant;
      if (body.note !== undefined) updates.note = body.note;
      if (body.allocationId !== undefined) updates.allocationId = body.allocationId;
      if (body.transactionAt !== undefined) updates.transactionAt = new Date(body.transactionAt);
      if (body.rawImageKey !== undefined) updates.rawImageKey = body.rawImageKey;

      const [updated] = await db
        .update(transactions)
        .set(updates)
        .where(eq(transactions.id, params.id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Transaksi tidak ditemukan" };
      }

      if (householdId) {
        broadcastToHousehold(householdId, userId, "transaction_changed");
      }

      return updated;
    },
    {
      body: t.Object({
        amount: t.Optional(t.Number()),
        merchant: t.Optional(t.String()),
        note: t.Optional(t.String()),
        allocationId: t.Optional(t.String()),
        transactionAt: t.Optional(t.String()),
        rawImageKey: t.Optional(t.String()),
      }),
    }
  )
  .delete("/:id", async ({ params, userId, householdId, set }) => {
    const [existingTxn] = await db
      .select({ periodId: transactions.periodId })
      .from(transactions)
      .where(eq(transactions.id, params.id));

    if (!existingTxn) {
      set.status = 404;
      return { error: "Transaksi tidak ditemukan" };
    }

    // Check if period is closed
    const [period] = await db
      .select({ isClosed: budgetPeriods.isClosed })
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, existingTxn.periodId));

    if (period?.isClosed) {
      set.status = 400;
      return { error: "PERIOD_CLOSED" };
    }

    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, params.id))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "Transaksi tidak ditemukan" };
    }

    if (householdId) {
      broadcastToHousehold(householdId, userId, "transaction_changed");
    }

    return { message: "Transaksi dihapus" };
  });
