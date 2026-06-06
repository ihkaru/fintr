import { db } from "../db/index";
import {
  budgetPeriods,
  budgetAllocations,
  envelopeTemplates,
  transactions,
  rolloverLogs,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

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
  householdId: string,
  options?: { fastForward?: boolean }
): Promise<RolloverResult> {
  // 1. Get the period being closed
  const [period] = await db.select().from(budgetPeriods).where(eq(budgetPeriods.id, periodId));

  if (!period) throw new Error("Period not found");
  if (period.isClosed) throw new Error("Period already closed");

  // Calculate month difference with current local time
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const monthDiff = (currentYear - period.year) * 12 + (currentMonth - period.month);

  // 2. Calculate next month/year
  let nextMonth = period.month + 1;
  let nextYear = period.year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // If the user wants to jump directly (fast-forward) or is forced to (gap > 6 months)
  if (monthDiff > 1 && (options?.fastForward || monthDiff > 6)) {
    nextMonth = currentMonth;
    nextYear = currentYear;
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

  // Get all active templates for this household
  const activeTemplates = await db
    .select()
    .from(envelopeTemplates)
    .where(
      and(eq(envelopeTemplates.householdId, householdId), eq(envelopeTemplates.isActive, true))
    );

  // Find Tabungan template for rollover_to_savings
  let savingsTemplate = activeTemplates.find(t => t.name === "Tabungan");

  // Calculate rollovers for each active template
  const templatesToInsert: Array<{
    templateId: string;
    envelopeName: string;
    defaultAmount: string;
    rolloverToNext: number;
    rolloverBehavior: string;
  }> = [];

  for (const template of activeTemplates) {
    const alloc = allocationsWithSpending.find(a => a.templateId === template.id);
    let rolloverToNext = 0;
    let remaining = 0;

    if (alloc) {
      const allocated = parseFloat(alloc.allocatedAmount);
      const rollover = parseFloat(alloc.rolloverAmount);
      const spent = parseFloat(alloc.totalSpent);
      remaining = allocated + rollover - spent;

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
    }

    templatesToInsert.push({
      templateId: template.id,
      envelopeName: template.name,
      defaultAmount: template.defaultAmount,
      rolloverToNext,
      rolloverBehavior: template.rolloverBehavior,
    });

    if (alloc) {
      rollovers.push({
        envelopeName: template.name,
        behavior: template.rolloverBehavior,
        remaining: remaining.toFixed(2),
        rolledOver: rolloverToNext.toFixed(2),
      });

      // Write logs to database
      let rolledOverAmount = 0;
      if (remaining > 0) {
        if (
          template.rolloverBehavior === "rollover_self" ||
          template.rolloverBehavior === "rollover_to_savings"
        ) {
          rolledOverAmount = remaining;
        }
      }

      await db.insert(rolloverLogs).values({
        householdId,
        fromPeriodId: periodId,
        toPeriodId: nextPeriod.id,
        envelopeName: template.name,
        behavior: template.rolloverBehavior as "reset" | "rollover_self" | "rollover_to_savings",
        remainingAmount: remaining.toFixed(2),
        rolledOverAmount: rolledOverAmount.toFixed(2),
      });
    }
  }

  // If we have rollover to savings but Tabungan template was deleted/deactivated, recover it
  if (!savingsTemplate && savingsRolloverTotal > 0) {
    const [inactiveSavings] = await db
      .select()
      .from(envelopeTemplates)
      .where(
        and(eq(envelopeTemplates.householdId, householdId), eq(envelopeTemplates.name, "Tabungan"))
      );

    if (inactiveSavings) {
      await db
        .update(envelopeTemplates)
        .set({ isActive: true })
        .where(eq(envelopeTemplates.id, inactiveSavings.id));
      savingsTemplate = { ...inactiveSavings, isActive: true };
    } else {
      const [newSavings] = await db
        .insert(envelopeTemplates)
        .values({
          householdId,
          name: "Tabungan",
          defaultAmount: "0",
          rolloverBehavior: "rollover_self",
          sortOrder: activeTemplates.length,
          color: "#22c55e",
        })
        .returning();
      savingsTemplate = newSavings;
    }

    templatesToInsert.push({
      templateId: savingsTemplate.id,
      envelopeName: savingsTemplate.name,
      defaultAmount: savingsTemplate.defaultAmount,
      rolloverToNext: 0,
      rolloverBehavior: savingsTemplate.rolloverBehavior,
    });
  }

  // Insert allocations for the next period
  for (const item of templatesToInsert) {
    if (item.envelopeName !== "Tabungan") {
      await db.insert(budgetAllocations).values({
        periodId: nextPeriod.id,
        templateId: item.templateId,
        allocatedAmount: item.defaultAmount,
        rolloverAmount: item.rolloverToNext.toFixed(2),
      });
    }
  }

  // Handle Tabungan — includes its own rollover + redirected savings
  if (savingsTemplate) {
    const tabunganItem = templatesToInsert.find(t => t.templateId === savingsTemplate.id);
    const tabunganRolloverSelf = tabunganItem ? tabunganItem.rolloverToNext : 0;
    const totalSavingsRollover = tabunganRolloverSelf + savingsRolloverTotal;

    await db.insert(budgetAllocations).values({
      periodId: nextPeriod.id,
      templateId: savingsTemplate.id,
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
