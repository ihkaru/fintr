import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { budgetPeriods, budgetAllocations, envelopeTemplates, transactions } from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { closePeriodAndRollover } from "../services/rollover";
import { seedDefaultEnvelopes, seedInitialPeriod } from "../db/seed";

export const periodRoutes = new Elysia({ prefix: "/periods" })
  .use(authMiddleware)
  .get("/", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    let periods = await db
      .select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.householdId, householdId))
      .orderBy(desc(budgetPeriods.year), desc(budgetPeriods.month));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Case 1: No periods exist. Auto-seed.
    if (periods.length === 0) {
      const templates = await db
        .select()
        .from(envelopeTemplates)
        .where(eq(envelopeTemplates.householdId, householdId));

      if (templates.length === 0) {
        await seedDefaultEnvelopes(householdId);
      }

      await seedInitialPeriod(householdId, currentYear, currentMonth);

      periods = await db
        .select()
        .from(budgetPeriods)
        .where(eq(budgetPeriods.householdId, householdId))
        .orderBy(desc(budgetPeriods.year), desc(budgetPeriods.month));
    }
    // Case 2: Exactly 1 period exists, is not closed, is in the past, and has 0 transactions.
    // Automatically fast-forward to current year/month.
    else if (periods.length === 1 && !periods[0].isClosed) {
      const period = periods[0];
      const isPast =
        period.year < currentYear || (period.year === currentYear && period.month < currentMonth);

      if (isPast) {
        const [txCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.periodId, period.id));

        if (Number(txCount.count) === 0) {
          await db
            .update(budgetPeriods)
            .set({ year: currentYear, month: currentMonth })
            .where(eq(budgetPeriods.id, period.id));

          periods = await db
            .select()
            .from(budgetPeriods)
            .where(eq(budgetPeriods.householdId, householdId))
            .orderBy(desc(budgetPeriods.year), desc(budgetPeriods.month));

          console.log(
            `🔄 Automatically fast-forwarded empty initial period for household ${householdId} to ${currentMonth}/${currentYear}`
          );
        }
      }
    }

    return periods;
  })
  .post(
    "/",
    async ({ householdId, body, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      // Check if period already exists
      const existing = await db
        .select()
        .from(budgetPeriods)
        .where(
          and(
            eq(budgetPeriods.householdId, householdId),
            eq(budgetPeriods.year, body.year),
            eq(budgetPeriods.month, body.month)
          )
        );

      if (existing.length > 0) {
        set.status = 409;
        return { error: "Periode ini sudah ada" };
      }

      // Create period
      const [period] = await db
        .insert(budgetPeriods)
        .values({
          householdId,
          year: body.year,
          month: body.month,
          openingBalance: body.openingBalance?.toString(),
        })
        .returning();

      // Clone allocations from templates
      const templates = await db
        .select()
        .from(envelopeTemplates)
        .where(
          and(eq(envelopeTemplates.householdId, householdId), eq(envelopeTemplates.isActive, true))
        );

      if (templates.length > 0) {
        await db.insert(budgetAllocations).values(
          templates.map(t => ({
            periodId: period.id,
            templateId: t.id,
            allocatedAmount: t.defaultAmount,
            rolloverAmount: "0",
          }))
        );
      }

      return period;
    },
    {
      body: t.Object({
        year: t.Number(),
        month: t.Number({ minimum: 1, maximum: 12 }),
        openingBalance: t.Optional(t.Number()),
      }),
    }
  )
  .get("/compare", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    const periods = await db
      .select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.householdId, householdId))
      .orderBy(desc(budgetPeriods.year), desc(budgetPeriods.month))
      .limit(6);

    if (periods.length === 0) {
      return { periods: [], categories: [] };
    }

    // Sort periods chronologically (oldest to newest)
    const chronologicalPeriods = [...periods].reverse();
    const periodIds = periods.map(p => p.id);

    const allocations = await db
      .select({
        periodId: budgetAllocations.periodId,
        allocatedAmount: budgetAllocations.allocatedAmount,
        rolloverAmount: budgetAllocations.rolloverAmount,
        templateId: budgetAllocations.templateId,
        envelopeName: envelopeTemplates.name,
        envelopeColor: envelopeTemplates.color,
        totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        isActive: envelopeTemplates.isActive,
        transactionCount: sql<number>`CAST(COUNT(${transactions.id}) AS INTEGER)`,
      })
      .from(budgetAllocations)
      .innerJoin(envelopeTemplates, eq(budgetAllocations.templateId, envelopeTemplates.id))
      .leftJoin(transactions, eq(transactions.allocationId, budgetAllocations.id))
      .where(inArray(budgetAllocations.periodId, periodIds))
      .groupBy(
        budgetAllocations.periodId,
        budgetAllocations.allocatedAmount,
        budgetAllocations.rolloverAmount,
        budgetAllocations.templateId,
        envelopeTemplates.name,
        envelopeTemplates.color,
        envelopeTemplates.isActive
      );

    const filteredAllocations = allocations.filter(a => a.isActive || a.transactionCount > 0);

    // Build period totals
    const periodTotals = chronologicalPeriods.map(p => {
      const pAllocs = filteredAllocations.filter(a => a.periodId === p.id);
      const totalAllocated = pAllocs.reduce(
        (sum, a) => sum + parseFloat(a.allocatedAmount) + parseFloat(a.rolloverAmount),
        0
      );
      const totalSpent = pAllocs.reduce((sum, a) => sum + parseFloat(a.totalSpent), 0);

      const MONTH_NAMES = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const name = `${MONTH_NAMES[p.month]} ${p.year}`;

      return {
        id: p.id,
        year: p.year,
        month: p.month,
        name,
        totalAllocated: totalAllocated.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        totalRemaining: (totalAllocated - totalSpent).toFixed(2),
      };
    });

    // Group categories/envelopes
    const categoriesMap: Record<
      string,
      {
        name: string;
        color: string;
        history: Array<{ periodId: string; allocated: string; spent: string }>;
      }
    > = {};

    for (const alloc of filteredAllocations) {
      if (!categoriesMap[alloc.envelopeName]) {
        categoriesMap[alloc.envelopeName] = {
          name: alloc.envelopeName,
          color: alloc.envelopeColor || "#94a3b8",
          history: [],
        };
      }

      const allocatedValue = parseFloat(alloc.allocatedAmount) + parseFloat(alloc.rolloverAmount);
      categoriesMap[alloc.envelopeName].history.push({
        periodId: alloc.periodId,
        allocated: allocatedValue.toFixed(2),
        spent: parseFloat(alloc.totalSpent).toFixed(2),
      });
    }

    // Standardize histories to contain entries for all periods in chronologicalPeriods
    const categories = Object.values(categoriesMap).map(cat => {
      const history = chronologicalPeriods.map(p => {
        const found = cat.history.find(h => h.periodId === p.id);
        return {
          periodId: p.id,
          allocated: found ? found.allocated : "0.00",
          spent: found ? found.spent : "0.00",
        };
      });
      return {
        ...cat,
        history,
      };
    });

    return {
      periods: periodTotals,
      categories,
    };
  })
  .get("/:id", async ({ params, householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    // Get period
    const [period] = await db
      .select()
      .from(budgetPeriods)
      .where(and(eq(budgetPeriods.id, params.id), eq(budgetPeriods.householdId, householdId)));

    if (!period) {
      set.status = 404;
      return { error: "Periode tidak ditemukan" };
    }

    // Self-healing: if the period is currently active (not closed), ensure all active templates have allocations
    if (!period.isClosed) {
      const activeTemplates = await db
        .select()
        .from(envelopeTemplates)
        .where(
          and(eq(envelopeTemplates.householdId, householdId), eq(envelopeTemplates.isActive, true))
        );

      const existingAllocations = await db
        .select()
        .from(budgetAllocations)
        .where(eq(budgetAllocations.periodId, period.id));

      const existingTemplateIds = new Set(existingAllocations.map(a => a.templateId));
      const missingTemplates = activeTemplates.filter(t => !existingTemplateIds.has(t.id));

      if (missingTemplates.length > 0) {
        await db.insert(budgetAllocations).values(
          missingTemplates.map(t => ({
            periodId: period.id,
            templateId: t.id,
            allocatedAmount: t.defaultAmount,
            rolloverAmount: "0",
          }))
        );
      }
    }

    // Get allocations with spending totals
    const allocations = await db
      .select({
        id: budgetAllocations.id,
        templateId: budgetAllocations.templateId,
        allocatedAmount: budgetAllocations.allocatedAmount,
        rolloverAmount: budgetAllocations.rolloverAmount,
        envelopeName: envelopeTemplates.name,
        envelopeColor: envelopeTemplates.color,
        rolloverBehavior: envelopeTemplates.rolloverBehavior,
        totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        isActive: envelopeTemplates.isActive,
        transactionCount: sql<number>`CAST(COUNT(${transactions.id}) AS INTEGER)`,
      })
      .from(budgetAllocations)
      .innerJoin(envelopeTemplates, eq(budgetAllocations.templateId, envelopeTemplates.id))
      .leftJoin(transactions, eq(transactions.allocationId, budgetAllocations.id))
      .where(eq(budgetAllocations.periodId, params.id))
      .groupBy(
        budgetAllocations.id,
        budgetAllocations.templateId,
        budgetAllocations.allocatedAmount,
        budgetAllocations.rolloverAmount,
        envelopeTemplates.name,
        envelopeTemplates.color,
        envelopeTemplates.rolloverBehavior,
        envelopeTemplates.sortOrder,
        envelopeTemplates.isActive
      )
      .orderBy(envelopeTemplates.sortOrder);

    const filteredAllocations = allocations.filter(a => a.isActive || a.transactionCount > 0);

    // Compute totals
    const totalAllocated = filteredAllocations.reduce(
      (sum, a) => sum + parseFloat(a.allocatedAmount) + parseFloat(a.rolloverAmount),
      0
    );
    const totalSpent = filteredAllocations.reduce((sum, a) => sum + parseFloat(a.totalSpent), 0);

    return {
      period,
      allocations: filteredAllocations.map(a => ({
        ...a,
        remaining: (
          parseFloat(a.allocatedAmount) +
          parseFloat(a.rolloverAmount) -
          parseFloat(a.totalSpent)
        ).toFixed(2),
      })),
      summary: {
        totalAllocated: totalAllocated.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        totalRemaining: (totalAllocated - totalSpent).toFixed(2),
      },
    };
  })
  .post("/:id/close", async ({ params, householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    try {
      const result = await closePeriodAndRollover(params.id, householdId);
      return result;
    } catch (error) {
      set.status = 400;
      return { error: (error as Error).message };
    }
  });
