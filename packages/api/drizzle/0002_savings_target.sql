ALTER TABLE "envelope_templates" ADD COLUMN "is_savings_target" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "envelope_templates" SET "is_savings_target" = true WHERE "name" = 'Tabungan';
