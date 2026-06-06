import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { envelopeTemplates, budgetPeriods, budgetAllocations, transactions } from "../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { broadcastToHousehold } from "../services/sync";

export const envelopeRoutes = new Elysia({ prefix: "/envelopes" })
  .use(authMiddleware)
  .get("/", async ({ householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    const templates = await db
      .select()
      .from(envelopeTemplates)
      .where(
        and(eq(envelopeTemplates.householdId, householdId), eq(envelopeTemplates.isActive, true))
      )
      .orderBy(asc(envelopeTemplates.sortOrder));

    return templates;
  })
  .post(
    "/",
    async ({ householdId, userId, body, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      const [template] = await db
        .insert(envelopeTemplates)
        .values({
          householdId,
          name: body.name,
          defaultAmount: body.defaultAmount.toString(),
          rolloverBehavior: body.rolloverBehavior || "reset",
          color: body.color || "#6366f1",
          sortOrder: body.sortOrder || 0,
        })
        .returning();

      // Automatically create allocation in the current active period if there is one
      const [activePeriod] = await db
        .select()
        .from(budgetPeriods)
        .where(and(eq(budgetPeriods.householdId, householdId), eq(budgetPeriods.isClosed, false)));

      if (activePeriod) {
        await db.insert(budgetAllocations).values({
          periodId: activePeriod.id,
          templateId: template.id,
          allocatedAmount: template.defaultAmount,
          rolloverAmount: "0",
        });
      }

      broadcastToHousehold(householdId, userId, "envelope_changed");

      return template;
    },
    {
      body: t.Object({
        name: t.String(),
        defaultAmount: t.Number(),
        rolloverBehavior: t.Optional(
          t.Union([
            t.Literal("reset"),
            t.Literal("rollover_self"),
            t.Literal("rollover_to_savings"),
          ])
        ),
        color: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, householdId, userId, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.defaultAmount !== undefined) updates.defaultAmount = body.defaultAmount.toString();
      if (body.rolloverBehavior !== undefined) updates.rolloverBehavior = body.rolloverBehavior;
      if (body.color !== undefined) updates.color = body.color;
      if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

      const [updated] = await db
        .update(envelopeTemplates)
        .set(updates)
        .where(
          and(eq(envelopeTemplates.id, params.id), eq(envelopeTemplates.householdId, householdId))
        )
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Amplop tidak ditemukan" };
      }

      broadcastToHousehold(householdId, userId, "envelope_changed");

      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        defaultAmount: t.Optional(t.Number()),
        rolloverBehavior: t.Optional(
          t.Union([
            t.Literal("reset"),
            t.Literal("rollover_self"),
            t.Literal("rollover_to_savings"),
          ])
        ),
        color: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  .delete("/:id", async ({ params, householdId, userId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "Household required" };
    }

    // Soft delete template
    const [deactivated] = await db
      .update(envelopeTemplates)
      .set({ isActive: false })
      .where(
        and(eq(envelopeTemplates.id, params.id), eq(envelopeTemplates.householdId, householdId))
      )
      .returning();

    if (!deactivated) {
      set.status = 404;
      return { error: "Amplop tidak ditemukan" };
    }

    // Check if there's an active period to clean up the allocation if unused
    const [activePeriod] = await db
      .select()
      .from(budgetPeriods)
      .where(and(eq(budgetPeriods.householdId, householdId), eq(budgetPeriods.isClosed, false)));

    if (activePeriod) {
      const [allocation] = await db
        .select()
        .from(budgetAllocations)
        .where(
          and(
            eq(budgetAllocations.periodId, activePeriod.id),
            eq(budgetAllocations.templateId, params.id)
          )
        );

      if (allocation) {
        const txs = await db
          .select()
          .from(transactions)
          .where(eq(transactions.allocationId, allocation.id))
          .limit(1);

        if (txs.length === 0) {
          // Safe to delete allocation in active period as there are no transactions
          await db.delete(budgetAllocations).where(eq(budgetAllocations.id, allocation.id));
        }
      }
    }

    broadcastToHousehold(householdId, userId, "envelope_changed");

    return { message: "Amplop dihapus" };
  })
  .post(
    "/reorder",
    async ({ body, householdId, userId, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      // body.order is an array of { id, sortOrder }
      for (const item of body.order) {
        await db
          .update(envelopeTemplates)
          .set({ sortOrder: item.sortOrder })
          .where(
            and(eq(envelopeTemplates.id, item.id), eq(envelopeTemplates.householdId, householdId))
          );
      }

      broadcastToHousehold(householdId, userId, "envelope_changed");

      return { message: "Urutan diperbarui" };
    },
    {
      body: t.Object({
        order: t.Array(
          t.Object({
            id: t.String(),
            sortOrder: t.Number(),
          })
        ),
      }),
    }
  );
