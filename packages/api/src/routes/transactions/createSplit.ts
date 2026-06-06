import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { transactions, budgetPeriods } from "../../db/schema";
import { eq, and, sql, inArray, gte } from "drizzle-orm";
import { broadcastToHousehold } from "../../services/sync";
import { recalculateRolloverForHousehold } from "../../services/rollover";
import { normalizeMerchantName, isSameDay } from "./utils";
import { authMiddleware } from "../../middleware/auth";

export const createSplitRoute = new Elysia().use(authMiddleware).post(
  "/split",
  async ({ body, userId, householdId, set }) => {
    const periodIds = Array.from(new Set(body.transactions.map(t => t.periodId)));
    const closedPeriodIds: string[] = [];
    if (periodIds.length > 0) {
      const periods = await db
        .select({
          id: budgetPeriods.id,
          isClosed: budgetPeriods.isClosed,
          householdId: budgetPeriods.householdId,
          year: budgetPeriods.year,
          month: budgetPeriods.month,
        })
        .from(budgetPeriods)
        .where(inArray(budgetPeriods.id, periodIds));

      for (const p of periods) {
        if (p.isClosed) {
          if (!body.forceWriteClosedPeriod) {
            set.status = 400;
            return { error: "PERIOD_CLOSED" };
          }

          // Check if exactly 1 month prior to active period
          const [activePeriod] = await db
            .select()
            .from(budgetPeriods)
            .where(
              and(eq(budgetPeriods.householdId, p.householdId), eq(budgetPeriods.isClosed, false))
            );

          if (!activePeriod) {
            set.status = 400;
            return { error: "PERIOD_CLOSED" };
          }

          const monthDiff = (activePeriod.year - p.year) * 12 + (activePeriod.month - p.month);
          if (monthDiff !== 1) {
            set.status = 400;
            return { error: "PERIOD_CLOSED_TOO_FAR" };
          }

          closedPeriodIds.push(p.id);
        }
      }
    }

    // Duplicate detection
    if (!body.allowDuplicate && body.transactions.length > 0) {
      const firstPeriodId = body.transactions[0].periodId;
      const [pDetail] = await db
        .select({ householdId: budgetPeriods.householdId })
        .from(budgetPeriods)
        .where(eq(budgetPeriods.id, firstPeriodId));

      if (pDetail) {
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
              eq(budgetPeriods.householdId, pDetail.householdId),
              sql`${transactions.transactionAt} >= ${seventyTwoHoursAgo.toISOString()}::timestamptz`
            )
          );

        for (const item of body.transactions) {
          const duplicate = potentialDuplicates.find(t => {
            const matchAmount = t.amount === item.amount.toString();
            const matchMerchant =
              normalizeMerchantName(t.merchant) === normalizeMerchantName(item.merchant);

            const matchTime = isSameDay(new Date(t.transactionAt), new Date(item.transactionAt));

            return matchAmount && matchMerchant && matchTime;
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
      }
    }

    const results = await db.transaction(async tx => {
      const txns = [];
      for (const item of body.transactions) {
        const [inserted] = await tx
          .insert(transactions)
          .values({
            periodId: item.periodId,
            allocationId: item.allocationId,
            createdBy: userId,
            amount: item.amount.toString(),
            merchant: item.merchant || null,
            note: item.note || null,
            transactionAt: new Date(item.transactionAt),
            source: item.source || "manual",
            rawImageKey: item.rawImageKey || null,
          })
          .returning();
        txns.push(inserted);
      }
      return txns;
    });

    if (closedPeriodIds.length > 0) {
      const uniqueClosed = Array.from(new Set(closedPeriodIds));
      for (const cPeriodId of uniqueClosed) {
        const [p] = await db
          .select({ householdId: budgetPeriods.householdId })
          .from(budgetPeriods)
          .where(eq(budgetPeriods.id, cPeriodId));
        if (p) {
          await recalculateRolloverForHousehold(p.householdId, cPeriodId);
        }
      }
    }

    if (householdId) {
      broadcastToHousehold(householdId, userId, "transaction_changed");
    }

    return results;
  },
  {
    body: t.Object({
      transactions: t.Array(
        t.Object({
          periodId: t.String(),
          allocationId: t.String(),
          amount: t.Number(),
          merchant: t.Optional(t.String()),
          note: t.Optional(t.String()),
          transactionAt: t.String(), // ISO date string
          source: t.Optional(t.Union([t.Literal("manual"), t.Literal("ocr"), t.Literal("share")])),
          rawImageKey: t.Optional(t.String()),
        })
      ),
      forceWriteClosedPeriod: t.Optional(t.Boolean()),
      allowDuplicate: t.Optional(t.Boolean()),
    }),
  }
);
