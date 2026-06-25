CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE TABLE IF NOT EXISTS "paper_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" text NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "version_number" integer NOT NULL,
  "source_json" jsonb NOT NULL,
  "imported_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "access_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code_hash" text NOT NULL,
  "label" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "paper_access_codes" (
  "paper_id" text NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "access_code_id" uuid NOT NULL REFERENCES "access_codes"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "paper_access_codes_pk" PRIMARY KEY ("paper_id", "access_code_id")
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" text NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "paper_version_id" uuid NOT NULL REFERENCES "paper_versions"("id") ON DELETE cascade,
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

CREATE TABLE IF NOT EXISTS "question_parts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE cascade,
  "paper_version_id" uuid NOT NULL REFERENCES "paper_versions"("id") ON DELETE cascade,
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

CREATE TABLE IF NOT EXISTS "attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" text NOT NULL REFERENCES "papers"("id") ON DELETE restrict,
  "paper_version_id" uuid NOT NULL REFERENCES "paper_versions"("id") ON DELETE restrict,
  "access_code_id" uuid NOT NULL REFERENCES "access_codes"("id") ON DELETE restrict,
  "student_name" text NOT NULL,
  "normalized_student_name" text NOT NULL,
  "attempt_number" integer NOT NULL,
  "status" text DEFAULT 'in_progress' NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "submitted_at" timestamp with time zone,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "elapsed_seconds" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "part_answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL REFERENCES "attempts"("id") ON DELETE cascade,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE restrict,
  "question_part_id" uuid NOT NULL REFERENCES "question_parts"("id") ON DELETE restrict,
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

CREATE INDEX IF NOT EXISTS "papers_status_idx" ON "papers" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "paper_versions_paper_version_unique" ON "paper_versions" ("paper_id", "version_number");
CREATE UNIQUE INDEX IF NOT EXISTS "access_codes_code_hash_unique" ON "access_codes" ("code_hash");
CREATE INDEX IF NOT EXISTS "access_codes_active_idx" ON "access_codes" ("active");
CREATE INDEX IF NOT EXISTS "paper_access_codes_access_code_idx" ON "paper_access_codes" ("access_code_id");
CREATE INDEX IF NOT EXISTS "questions_paper_version_idx" ON "questions" ("paper_version_id");
CREATE UNIQUE INDEX IF NOT EXISTS "questions_version_external_unique" ON "questions" ("paper_version_id", "external_id");
CREATE INDEX IF NOT EXISTS "question_parts_question_idx" ON "question_parts" ("question_id");
CREATE UNIQUE INDEX IF NOT EXISTS "question_parts_version_external_unique" ON "question_parts" ("paper_version_id", "external_id");
CREATE INDEX IF NOT EXISTS "attempts_paper_student_idx" ON "attempts" ("paper_id", "access_code_id", "normalized_student_name");
CREATE INDEX IF NOT EXISTS "attempts_status_idx" ON "attempts" ("status");
CREATE INDEX IF NOT EXISTS "attempts_last_seen_idx" ON "attempts" ("last_seen_at");
CREATE UNIQUE INDEX IF NOT EXISTS "part_answers_attempt_part_unique" ON "part_answers" ("attempt_id", "question_part_id");
CREATE INDEX IF NOT EXISTS "part_answers_attempt_idx" ON "part_answers" ("attempt_id");
