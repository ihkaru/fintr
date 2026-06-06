import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { transactions, budgetPeriods } from "../../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { broadcastToHousehold } from "../../services/sync";
import { recalculateRolloverForHousehold } from "../../services/rollover";
import { normalizeMerchantName, isSameDay } from "./utils";
import { authMiddleware } from "../../middleware/auth";

export const createRoute = new Elysia().use(authMiddleware).post(
  "/",
  async ({ body, userId, householdId, set }) => {
    // Check if period exists and get details
    const [period] = await db
      .select({
        isClosed: budgetPeriods.isClosed,
        householdId: budgetPeriods.householdId,
        year: budgetPeriods.year,
        month: budgetPeriods.month,
      })
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, body.periodId));

    if (!period) {
      set.status = 404;
      return { error: "Periode tidak ditemukan" };
    }

    let wasClosed = false;
    if (period.isClosed) {
      if (!body.forceWriteClosedPeriod) {
        set.status = 400;
        return { error: "PERIOD_CLOSED" };
      }

      // Check if the closed period is exactly 1 month prior to the active period
      const [activePeriod] = await db
        .select()
        .from(budgetPeriods)
        .where(
          and(eq(budgetPeriods.householdId, period.householdId), eq(budgetPeriods.isClosed, false))
        );

      if (!activePeriod) {
        set.status = 400;
        return { error: "PERIOD_CLOSED" };
      }

      const monthDiff =
        (activePeriod.year - period.year) * 12 + (activePeriod.month - period.month);
      if (monthDiff !== 1) {
        set.status = 400;
        return { error: "PERIOD_CLOSED_TOO_FAR" };
      }

      wasClosed = true;
    }

    // Duplicate detection
    if (!body.allowDuplicate) {
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const potentialDuplicates = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          merchant: transactions.merchant,
          transactionAt: transactions.transactionAt,
          createdBy: transactions.createdBy,
        })
        .from(transactions)
        .innerJoin(budgetPeriods, eq(transactions.periodId, budgetPeriods.id))
        .where(
          and(
            eq(budgetPeriods.householdId, period.householdId),
            eq(transactions.amount, body.amount.toString()),
            sql`${transactions.transactionAt} >= ${seventyTwoHoursAgo.toISOString()}::timestamptz`
          )
        );

      const duplicate = potentialDuplicates.find(t => {
        const matchMerchant =
          normalizeMerchantName(t.merchant) === normalizeMerchantName(body.merchant);

        const matchTime = isSameDay(new Date(t.transactionAt), new Date(body.transactionAt));

        return matchMerchant && matchTime;
      });

      if (duplicate) {
        set.status = 409;
        return {
          error: "DUPLICATE_TRANSACTION_DETECTED",
          message: "Transaksi serupa telah dicatat sebelumnya.",
          duplicate,
        };
      }
    }

    const [txn] = await db
      .insert(transactions)
      .values({
        periodId: body.periodId,
        allocationId: body.allocationId,
        createdBy: userId,
        amount: body.amount.toString(),
        merchant: body.merchant || null,
        note: body.note || null,
        transactionAt: new Date(body.transactionAt),
        source: body.source || "manual",
        rawImageKey: body.rawImageKey || null,
      })
      .returning();

    if (wasClosed) {
      await recalculateRolloverForHousehold(period.householdId, body.periodId);
    }

    if (householdId) {
      broadcastToHousehold(householdId, userId, "transaction_changed");
    }

    return txn;
  },
  {
    body: t.Object({
      periodId: t.String(),
      allocationId: t.String(),
      amount: t.Number(),
      merchant: t.Optional(t.String()),
      note: t.Optional(t.String()),
      transactionAt: t.String(), // ISO date string
      source: t.Optional(t.Union([t.Literal("manual"), t.Literal("ocr"), t.Literal("share")])),
      rawImageKey: t.Optional(t.String()),
      forceWriteClosedPeriod: t.Optional(t.Boolean()),
      allowDuplicate: t.Optional(t.Boolean()),
    }),
  }
);
