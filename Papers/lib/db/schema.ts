import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import type {
  ImportedPaper,
  MarkingSchema,
  MarkingSource,
  ResponseSchema,
  Stimulus,
  StudentAnswer
} from "@/lib/domain";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const papers = pgTable(
  "papers",
  {
    id: text("id").primaryKey(),
    currentVersionId: uuid("current_version_id"),
    title: text("title").notNull(),
    syllabus: text("syllabus").notNull(),
    mode: text("mode").notNull().default("practice"),
    status: text("status").notNull().default("draft"),
    totalMarks: integer("total_marks").notNull(),
    ...timestamps
  },
  (table) => ({
    statusIdx: index("papers_status_idx").on(table.status)
  })
);

export const paperVersions = pgTable(
  "paper_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    sourceJson: jsonb("source_json").$type<ImportedPaper>().notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    paperVersionUnique: uniqueIndex("paper_versions_paper_version_unique").on(
      table.paperId,
      table.versionNumber
    )
  })
);

export const accessCodes = pgTable(
  "access_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codeHash: text("code_hash").notNull(),
    label: text("label").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps
  },
  (table) => ({
    codeHashUnique: uniqueIndex("access_codes_code_hash_unique").on(table.codeHash),
    activeIdx: index("access_codes_active_idx").on(table.active)
  })
);

export const paperAccessCodes = pgTable(
  "paper_access_codes",
  {
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    accessCodeId: uuid("access_code_id")
      .notNull()
      .references(() => accessCodes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.paperId, table.accessCodeId] }),
    accessCodeIdx: index("paper_access_codes_access_code_idx").on(table.accessCodeId)
  })
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    paperVersionId: uuid("paper_version_id")
      .notNull()
      .references(() => paperVersions.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    marks: integer("marks").notNull(),
    outcomeId: text("outcome_id"),
    variantGroupId: text("variant_group_id"),
    targetAnswerId: text("target_answer_id"),
    difficulty: text("difficulty"),
    stimulus: jsonb("stimulus").$type<Stimulus[]>().notNull().default([]),
    position: integer("position").notNull()
  },
  (table) => ({
    paperVersionIdx: index("questions_paper_version_idx").on(table.paperVersionId),
    externalUnique: uniqueIndex("questions_version_external_unique").on(
      table.paperVersionId,
      table.externalId
    )
  })
);

export const questionParts = pgTable(
  "question_parts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    paperVersionId: uuid("paper_version_id")
      .notNull()
      .references(() => paperVersions.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    label: text("label").notNull(),
    type: text("type").notNull(),
    prompt: text("prompt").notNull(),
    marks: integer("marks").notNull(),
    outcomeId: text("outcome_id"),
    variantGroupId: text("variant_group_id"),
    targetAnswerId: text("target_answer_id"),
    difficulty: text("difficulty"),
    stimulus: jsonb("stimulus").$type<Stimulus[]>().notNull().default([]),
    responseSchema: jsonb("response_schema").$type<ResponseSchema>(),
    markingSchema: jsonb("marking_schema").$type<MarkingSchema>().notNull(),
    studentFeedbackPolicy: text("student_feedback_policy"),
    position: integer("position").notNull()
  },
  (table) => ({
    questionIdx: index("question_parts_question_idx").on(table.questionId),
    versionExternalUnique: uniqueIndex("question_parts_version_external_unique").on(
      table.paperVersionId,
      table.externalId
    )
  })
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "restrict" }),
    paperVersionId: uuid("paper_version_id")
      .notNull()
      .references(() => paperVersions.id, { onDelete: "restrict" }),
    accessCodeId: uuid("access_code_id")
      .notNull()
      .references(() => accessCodes.id, { onDelete: "restrict" }),
    studentName: text("student_name").notNull(),
    normalizedStudentName: text("normalized_student_name").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    status: text("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    elapsedSeconds: integer("elapsed_seconds").notNull().default(0)
  },
  (table) => ({
    paperStudentIdx: index("attempts_paper_student_idx").on(
      table.paperId,
      table.accessCodeId,
      table.normalizedStudentName
    ),
    statusIdx: index("attempts_status_idx").on(table.status),
    lastSeenIdx: index("attempts_last_seen_idx").on(table.lastSeenAt)
  })
);

export const partAnswers = pgTable(
  "part_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    questionPartId: uuid("question_part_id")
      .notNull()
      .references(() => questionParts.id, { onDelete: "restrict" }),
    answer: jsonb("answer").$type<StudentAnswer>().notNull().default({}),
    score: integer("score"),
    maxScore: integer("max_score").notNull(),
    markingStatus: text("marking_status").notNull().default("pending"),
    markingSource: text("marking_source").$type<MarkingSource>().notNull().default("auto"),
    studentFeedback: text("student_feedback"),
    tutorRationale: text("tutor_rationale"),
    missingRubricPoints: jsonb("missing_rubric_points").$type<string[]>().notNull().default([]),
    exactMarkingDetails: jsonb("exact_marking_details").$type<unknown>(),
    markedAt: timestamp("marked_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    attemptPartUnique: uniqueIndex("part_answers_attempt_part_unique").on(
      table.attemptId,
      table.questionPartId
    ),
    attemptIdx: index("part_answers_attempt_idx").on(table.attemptId)
  })
);
