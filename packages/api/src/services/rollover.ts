import { db } from "../db/index";
import { budgetPeriods, budgetAllocations, envelopeTemplates, transactions } from "../db/schema";
import { eq, sql } from "drizzle-orm";

interface RolloverResult {
  nextPeriodId: string;
  rollovers: Array<{
    envelopeName: string;
    behavior: string;
    remaining: string;
    rolledOver: string;
  }>;
}

/**
 * Close a budget period and execute rollover logic:
 * 1. Calculate remaining per envelope (allocated + rollover - spent)
 * 2. Based on rollover_behavior:
 *    - reset: remaining goes to 0
 *    - rollover_self: remaining carries to next period's same envelope
 *    - rollover_to_savings: remaining adds to Tabungan envelope in next period
 * 3. Create next period with updated allocations
 */
export async function closePeriodAndRollover(
  periodId: string,
  householdId: string
): Promise<RolloverResult> {
  // 1. Get the period being closed
  const [period] = await db.select().from(budgetPeriods).where(eq(budgetPeriods.id, periodId));

  if (!period) throw new Error("Period not found");
  if (period.isClosed) throw new Error("Period already closed");

  // 2. Calculate next month/year
  let nextMonth = period.month + 1;
  let nextYear = period.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // 3. Get all allocations with their template info and spent totals
  const allocationsWithSpending = await db
    .select({
      allocationId: budgetAllocations.id,
      templateId: budgetAllocations.templateId,
      allocatedAmount: budgetAllocations.allocatedAmount,
      rolloverAmount: budgetAllocations.rolloverAmount,
      envelopeName: envelopeTemplates.name,
      rolloverBehavior: envelopeTemplates.rolloverBehavior,
      defaultAmount: envelopeTemplates.defaultAmount,
      totalSpent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(budgetAllocations)
    .innerJoin(envelopeTemplates, eq(budgetAllocations.templateId, envelopeTemplates.id))
    .leftJoin(transactions, eq(transactions.allocationId, budgetAllocations.id))
    .where(eq(budgetAllocations.periodId, periodId))
    .groupBy(
      budgetAllocations.id,
      budgetAllocations.templateId,
      budgetAllocations.allocatedAmount,
      budgetAllocations.rolloverAmount,
      envelopeTemplates.name,
      envelopeTemplates.rolloverBehavior,
      envelopeTemplates.defaultAmount
    );

  // 4. Create next period
  const [nextPeriod] = await db
    .insert(budgetPeriods)
    .values({
      householdId,
      year: nextYear,
      month: nextMonth,
    })
    .returning();

  // 5. Calculate rollovers and create next period's allocations
  let savingsRolloverTotal = 0;
  const rollovers: RolloverResult["rollovers"] = [];

  // Find Tabungan template for rollover_to_savings
  const savingsTemplate = allocationsWithSpending.find(a => a.envelopeName === "Tabungan");

  for (const alloc of allocationsWithSpending) {
    const allocated = parseFloat(alloc.allocatedAmount);
    const rollover = parseFloat(alloc.rolloverAmount);
    const spent = parseFloat(alloc.totalSpent);
    const remaining = allocated + rollover - spent;

    let rolloverToNext = 0;

    if (remaining > 0) {
      switch (alloc.rolloverBehavior) {
        case "reset":
          rolloverToNext = 0;
          break;
        case "rollover_self":
          rolloverToNext = remaining;
          break;
        case "rollover_to_savings":
          savingsRolloverTotal += remaining;
          rolloverToNext = 0;
          break;
      }
    }

    // Skip Tabungan for now — will add savings rollover at the end
    if (alloc.envelopeName !== "Tabungan") {
      await db.insert(budgetAllocations).values({
        periodId: nextPeriod.id,
        templateId: alloc.templateId,
        allocatedAmount: alloc.defaultAmount, // Use template default
        rolloverAmount: rolloverToNext.toFixed(2),
      });
    }

    rollovers.push({
      envelopeName: alloc.envelopeName,
      behavior: alloc.rolloverBehavior,
      remaining: remaining.toFixed(2),
      rolledOver: rolloverToNext.toFixed(2),
    });
  }

  // 6. Handle Tabungan — includes its own rollover + redirected savings
  if (savingsTemplate) {
    const allocated = parseFloat(savingsTemplate.allocatedAmount);
    const rollover = parseFloat(savingsTemplate.rolloverAmount);
    const spent = parseFloat(savingsTemplate.totalSpent);
    const remaining = allocated + rollover - spent;

    const totalSavingsRollover = remaining + savingsRolloverTotal;

    await db.insert(budgetAllocations).values({
      periodId: nextPeriod.id,
      templateId: savingsTemplate.templateId,
      allocatedAmount: savingsTemplate.defaultAmount,
      rolloverAmount: totalSavingsRollover.toFixed(2),
    });
  }

  // 7. Close the current period
  await db.update(budgetPeriods).set({ isClosed: true }).where(eq(budgetPeriods.id, periodId));

  return {
    nextPeriodId: nextPeriod.id,
    rollovers,
  };
}
