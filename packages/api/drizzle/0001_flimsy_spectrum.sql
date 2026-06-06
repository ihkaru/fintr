CREATE TABLE "rollover_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"from_period_id" uuid NOT NULL,
	"to_period_id" uuid NOT NULL,
	"envelope_name" text NOT NULL,
	"behavior" "rollover_behavior" NOT NULL,
	"remaining_amount" numeric(12, 2) NOT NULL,
	"rolled_over_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rollover_logs" ADD CONSTRAINT "rollover_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollover_logs" ADD CONSTRAINT "rollover_logs_from_period_id_budget_periods_id_fk" FOREIGN KEY ("from_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollover_logs" ADD CONSTRAINT "rollover_logs_to_period_id_budget_periods_id_fk" FOREIGN KEY ("to_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE cascade ON UPDATE no action;