import { db } from "./index";
import { envelopeTemplates, budgetPeriods, budgetAllocations } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Seeds default envelope templates for a given household.
 * Called automatically when a new household is created during first login.
 */
export async function seedDefaultEnvelopes(householdId: string) {
  const defaults = [
    {
      name: "Makan & Dapur",
      defaultAmount: "2500000",
      color: "#ef4444",
      rolloverBehavior: "reset" as const,
      sortOrder: 0,
    },
    {
      name: "Transportasi & Bensin",
      defaultAmount: "800000",
      color: "#f97316",
      rolloverBehavior: "reset" as const,
      sortOrder: 1,
    },
    {
      name: "Kebutuhan Rumah",
      defaultAmount: "1000000",
      color: "#8b5cf6",
      rolloverBehavior: "reset" as const,
      sortOrder: 2,
    },
    {
      name: "Komunikasi & Internet",
      defaultAmount: "200000",
      color: "#06b6d4",
      rolloverBehavior: "reset" as const,
      sortOrder: 3,
    },
    {
      name: "Kesehatan",
      defaultAmount: "300000",
      color: "#10b981",
      rolloverBehavior: "rollover_to_savings" as const,
      sortOrder: 4,
    },
    {
      name: "Hiburan & Lifestyle",
      defaultAmount: "500000",
      color: "#ec4899",
      rolloverBehavior: "reset" as const,
      sortOrder: 5,
    },
    {
      name: "Darurat",
      defaultAmount: "500000",
      color: "#f59e0b",
      rolloverBehavior: "rollover_self" as const,
      sortOrder: 6,
    },
    {
      name: "Tabungan",
      defaultAmount: "2000000",
      color: "#22c55e",
      rolloverBehavior: "rollover_self" as const,
      sortOrder: 7,
    },
  ];

  await db.insert(envelopeTemplates).values(
    defaults.map(d => ({
      householdId,
      name: d.name,
      defaultAmount: d.defaultAmount,
      rolloverBehavior: d.rolloverBehavior,
      sortOrder: d.sortOrder,
      color: d.color,
    }))
  );

  console.log(`✅ Seeded ${defaults.length} default envelopes for household ${householdId}`);
}

/**
 * Creates the initial June 2025 budget period with allocations from templates.
 */
export async function seedInitialPeriod(householdId: string) {
  const templates = await db
    .select()
    .from(envelopeTemplates)
    .where(eq(envelopeTemplates.householdId, householdId));

  if (templates.length === 0) {
    console.log("⚠️ No templates found, skipping period creation");
    return;
  }

  const [period] = await db
    .insert(budgetPeriods)
    .values({
      householdId,
      year: 2025,
      month: 6,
    })
    .returning();

  await db.insert(budgetAllocations).values(
    templates.map(t => ({
      periodId: period.id,
      templateId: t.id,
      allocatedAmount: t.defaultAmount,
      rolloverAmount: "0",
    }))
  );

  console.log(`✅ Created June 2025 budget period with ${templates.length} allocations`);
}

// Run directly: bun run src/db/seed.ts
if (import.meta.main) {
  console.log("🌱 Running seed...");
  // This is for manual seeding — normally seeding happens during first login
  console.log(
    "ℹ️  Default envelopes are seeded automatically when a new household is created via Google Login."
  );
  console.log("ℹ️  Run this script only for development/testing with a known household ID.");
  process.exit(0);
}
