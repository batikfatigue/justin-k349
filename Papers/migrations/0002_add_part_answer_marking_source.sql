ALTER TABLE "part_answers" ADD COLUMN IF NOT EXISTS "marking_source" text DEFAULT 'auto' NOT NULL;
--> statement-breakpoint
UPDATE "part_answers" SET "marking_source" = 'auto' WHERE "marking_source" IS NULL;
