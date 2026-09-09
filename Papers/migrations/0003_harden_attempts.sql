ALTER TABLE "part_answers" ALTER COLUMN "score" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "session_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attempts_paper_student_attempt_unique" ON "attempts" USING btree ("paper_id","access_code_id","normalized_student_name","attempt_number");