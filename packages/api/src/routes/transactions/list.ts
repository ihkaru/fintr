import { Elysia, t } from "elysia";
import { db } from "../../db/index";
import { transactions, budgetAllocations, budgetPeriods, envelopeTemplates } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "../../middleware/auth";

export const listRoute = new Elysia().use(authMiddleware).get(
  "/",
  async ({ query, householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    // Build query with filters
    const conditions = [eq(budgetPeriods.householdId, householdId)];

    if (query.periodId) {
      conditions.push(eq(transactions.periodId, query.periodId));
    }
    if (query.allocationId) {
      conditions.push(eq(transactions.allocationId, query.allocationId));
    }

    const results = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        merchant: transactions.merchant,
        note: transactions.note,
        transactionAt: transactions.transactionAt,
        source: transactions.source,
        createdBy: transactions.createdBy,
        envelopeName: envelopeTemplates.name,
        envelopeColor: envelopeTemplates.color,
        rawImageKey: transactions.rawImageKey,
      })
      .from(transactions)
      .innerJoin(budgetAllocations, eq(transactions.allocationId, budgetAllocations.id))
      .innerJoin(envelopeTemplates, eq(budgetAllocations.templateId, envelopeTemplates.id))
      .innerJoin(budgetPeriods, eq(transactions.periodId, budgetPeriods.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionAt))
      .limit(query.limit ? parseInt(query.limit) : 50)
      .offset(query.offset ? parseInt(query.offset) : 0);

    return results;
  },
  {
    query: t.Object({
      periodId: t.Optional(t.String()),
      allocationId: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
    }),
  }
);
