import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  smallint,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────────

export const householdRoleEnum = pgEnum("household_role", ["owner", "member"]);

export const rolloverBehaviorEnum = pgEnum("rollover_behavior", [
  "reset",
  "rollover_self",
  "rollover_to_savings",
]);

export const transactionSourceEnum = pgEnum("transaction_source", ["manual", "ocr", "share"]);

// ── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleSub: text("google_sub").unique().notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  householdMembers: many(householdMembers),
  transactions: many(transactions),
  accountSnapshots: many(accountSnapshots),
}));

// ── Households ─────────────────────────────────────────────────────────────────

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(householdMembers),
  envelopeTemplates: many(envelopeTemplates),
  budgetPeriods: many(budgetPeriods),
  accountSnapshots: many(accountSnapshots),
}));

// ── Household Members ──────────────────────────────────────────────────────────

export const householdMembers = pgTable(
  "household_members",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: householdRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [primaryKey({ columns: [table.householdId, table.userId] })]
);

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  household: one(households, {
    fields: [householdMembers.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [householdMembers.userId],
    references: [users.id],
  }),
}));

// ── Envelope Templates ─────────────────────────────────────────────────────────

export const envelopeTemplates = pgTable("envelope_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  defaultAmount: numeric("default_amount", { precision: 12, scale: 2 }).notNull(),
  rolloverBehavior: rolloverBehaviorEnum("rollover_behavior").notNull().default("reset"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const envelopeTemplatesRelations = relations(envelopeTemplates, ({ one, many }) => ({
  household: one(households, {
    fields: [envelopeTemplates.householdId],
    references: [households.id],
  }),
  allocations: many(budgetAllocations),
}));

// ── Budget Periods ─────────────────────────────────────────────────────────────

export const budgetPeriods = pgTable(
  "budget_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    year: smallint("year").notNull(),
    month: smallint("month").notNull(),
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }),
    isClosed: boolean("is_closed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [unique("uq_household_year_month").on(table.householdId, table.year, table.month)]
);

export const budgetPeriodsRelations = relations(budgetPeriods, ({ one, many }) => ({
  household: one(households, {
    fields: [budgetPeriods.householdId],
    references: [households.id],
  }),
  allocations: many(budgetAllocations),
  transactions: many(transactions),
}));

// ── Budget Allocations ─────────────────────────────────────────────────────────

export const budgetAllocations = pgTable("budget_allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id")
    .notNull()
    .references(() => budgetPeriods.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => envelopeTemplates.id, { onDelete: "cascade" }),
  allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 }).notNull(),
  rolloverAmount: numeric("rollover_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgetAllocationsRelations = relations(budgetAllocations, ({ one, many }) => ({
  period: one(budgetPeriods, {
    fields: [budgetAllocations.periodId],
    references: [budgetPeriods.id],
  }),
  template: one(envelopeTemplates, {
    fields: [budgetAllocations.templateId],
    references: [envelopeTemplates.id],
  }),
  transactions: many(transactions),
}));

// ── Transactions ───────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id")
    .notNull()
    .references(() => budgetPeriods.id, { onDelete: "cascade" }),
  allocationId: uuid("allocation_id")
    .notNull()
    .references(() => budgetAllocations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  merchant: text("merchant"),
  note: text("note"),
  transactionAt: timestamp("transaction_at", { withTimezone: true }).notNull(),
  source: transactionSourceEnum("source").notNull().default("manual"),
  rawImageKey: text("raw_image_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  period: one(budgetPeriods, {
    fields: [transactions.periodId],
    references: [budgetPeriods.id],
  }),
  allocation: one(budgetAllocations, {
    fields: [transactions.allocationId],
    references: [budgetAllocations.id],
  }),
  createdByUser: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
}));

// ── Account Snapshots (Reconciliation) ─────────────────────────────────────────

export const accountSnapshots = pgTable("account_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
  actualBalance: numeric("actual_balance", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accountSnapshotsRelations = relations(accountSnapshots, ({ one }) => ({
  household: one(households, {
    fields: [accountSnapshots.householdId],
    references: [households.id],
  }),
  createdByUser: one(users, {
    fields: [accountSnapshots.createdBy],
    references: [users.id],
  }),
}));
