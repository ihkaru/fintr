import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../packages/api/src/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const connectionString = "postgresql://fintr:fintr_secret@localhost:5432/fintr";
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

async function run() {
  try {
    console.log("=== BUDGET PERIODS ===");
    const periods = await db.select().from(schema.budgetPeriods);
    console.log(periods);

    for (const p of periods) {
      console.log(`\n=== PERIOD ${p.year}-${p.month} (ID: ${p.id}) ===`);

      const allocations = await db
        .select()
        .from(schema.budgetAllocations)
        .where(eq(schema.budgetAllocations.periodId, p.id));
      console.log("Allocations count:", allocations.length);
      let sumAllocated = 0;
      let sumRollover = 0;
      allocations.forEach(a => {
        sumAllocated += parseFloat(a.allocatedAmount || "0");
        sumRollover += parseFloat(a.rolloverAmount || "0");
      });
      console.log("Sum AllocatedAmount:", sumAllocated);
      console.log("Sum RolloverAmount:", sumRollover);
      console.log("Total Allocated (Allocated + Rollover):", sumAllocated + sumRollover);

      const txs = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.periodId, p.id));
      console.log("Transactions count:", txs.length);
      let sumTxs = 0;
      txs.forEach(t => {
        sumTxs += parseFloat(t.amount || "0");
      });
      console.log("Sum Transactions Amount:", sumTxs);
      console.log(
        "Expected Balance (Total Allocated - Sum Transactions):",
        sumAllocated + sumRollover - sumTxs
      );
    }

    console.log("\n=== SNAPSHOTS ===");
    const snapshots = await db
      .select()
      .from(schema.accountSnapshots)
      .orderBy(desc(schema.accountSnapshots.snapshotAt));
    console.log(snapshots);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await queryClient.end();
  }
}

run();
