ALTER TABLE "part_answers" ALTER COLUMN "score" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "session_token" text;--> statement-breakpoint
WITH dup AS (
  SELECT "id", "paper_id", "access_code_id", "normalized_student_name",
         ROW_NUMBER() OVER (PARTITION BY "paper_id", "access_code_id", "normalized_student_name", "attempt_number" ORDER BY "started_at", "id") AS "dup_rn",
         MAX("attempt_number") OVER (PARTITION BY "paper_id", "access_code_id", "normalized_student_name") AS "group_max"
  FROM "attempts"
),
renumbered AS (
  SELECT "id", "group_max",
         ROW_NUMBER() OVER (PARTITION BY "paper_id", "access_code_id", "normalized_student_name" ORDER BY "dup_rn") AS "renum"
  FROM "dup"
  WHERE "dup_rn" > 1
)
UPDATE "attempts" AS "a"
SET "attempt_number" = "r"."group_max" + "r"."renum"
FROM "renumbered" AS "r"
WHERE "a"."id" = "r"."id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attempts_paper_student_attempt_unique" ON "attempts" USING btree ("paper_id","access_code_id","normalized_student_name","attempt_number");