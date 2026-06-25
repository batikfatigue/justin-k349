CREATE TABLE IF NOT EXISTS "access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" text NOT NULL,
	"paper_version_id" uuid NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_name" text NOT NULL,
	"normalized_student_name" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "paper_access_codes" (
	"paper_id" text NOT NULL,
	"access_code_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paper_access_codes_paper_id_access_code_id_pk" PRIMARY KEY("paper_id","access_code_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "paper_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"source_json" jsonb NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "papers" (
	"id" text PRIMARY KEY NOT NULL,
	"current_version_id" uuid,
	"title" text NOT NULL,
	"syllabus" text NOT NULL,
	"mode" text DEFAULT 'practice' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_marks" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"question_part_id" uuid NOT NULL,
	"answer" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer,
	"max_score" integer NOT NULL,
	"marking_status" text DEFAULT 'pending' NOT NULL,
	"student_feedback" text,
	"tutor_rationale" text,
	"missing_rubric_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exact_marking_details" jsonb,
	"marked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"paper_version_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"prompt" text NOT NULL,
	"marks" integer NOT NULL,
	"outcome_id" text,
	"variant_group_id" text,
	"target_answer_id" text,
	"difficulty" text,
	"stimulus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"response_schema" jsonb,
	"marking_schema" jsonb NOT NULL,
	"student_feedback_policy" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" text NOT NULL,
	"paper_version_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"marks" integer NOT NULL,
	"outcome_id" text,
	"variant_group_id" text,
	"target_answer_id" text,
	"difficulty" text,
	"stimulus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_paper_version_id_paper_versions_id_fk" FOREIGN KEY ("paper_version_id") REFERENCES "public"."paper_versions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "paper_access_codes" ADD CONSTRAINT "paper_access_codes_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "paper_access_codes" ADD CONSTRAINT "paper_access_codes_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "paper_versions" ADD CONSTRAINT "paper_versions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "part_answers" ADD CONSTRAINT "part_answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "part_answers" ADD CONSTRAINT "part_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "part_answers" ADD CONSTRAINT "part_answers_question_part_id_question_parts_id_fk" FOREIGN KEY ("question_part_id") REFERENCES "public"."question_parts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "question_parts" ADD CONSTRAINT "question_parts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "question_parts" ADD CONSTRAINT "question_parts_paper_version_id_paper_versions_id_fk" FOREIGN KEY ("paper_version_id") REFERENCES "public"."paper_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_version_id_paper_versions_id_fk" FOREIGN KEY ("paper_version_id") REFERENCES "public"."paper_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "access_codes_code_hash_unique" ON "access_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_codes_active_idx" ON "access_codes" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_paper_student_idx" ON "attempts" USING btree ("paper_id","access_code_id","normalized_student_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_status_idx" ON "attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_last_seen_idx" ON "attempts" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "paper_access_codes_access_code_idx" ON "paper_access_codes" USING btree ("access_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "paper_versions_paper_version_unique" ON "paper_versions" USING btree ("paper_id","version_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "papers_status_idx" ON "papers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "part_answers_attempt_part_unique" ON "part_answers" USING btree ("attempt_id","question_part_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "part_answers_attempt_idx" ON "part_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_parts_question_idx" ON "question_parts" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "question_parts_version_external_unique" ON "question_parts" USING btree ("paper_version_id","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_paper_version_idx" ON "questions" USING btree ("paper_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "questions_version_external_unique" ON "questions" USING btree ("paper_version_id","external_id");