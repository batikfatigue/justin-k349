import { beforeEach, describe, expect, it, vi } from "vitest";
import { attempts, papers, partAnswers, questionParts, questions } from "@/lib/db/schema";
import type { StudentSession } from "@/lib/auth/session";
import { getStudentQuestion, saveQuestionAnswers } from "@/lib/student/data";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  }
}));

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  getDb: dbMocks.getDb
}));

type Operation = {
  kind: "select" | "insert" | "update";
  table?: unknown;
  whereArgs: unknown[];
  limitValue?: number;
  offsetValue?: number;
  valuesPayload?: unknown;
  conflictConfig?: unknown;
  setPayload?: unknown;
};

class SelectBuilder {
  constructor(
    private readonly db: FakeDb,
    private readonly operation: Operation
  ) {}

  from(table: unknown) {
    this.operation.table = table;
    return this;
  }

  where(condition: unknown) {
    this.operation.whereArgs.push(condition);
    return this;
  }

  orderBy(..._columns: unknown[]) {
    return this;
  }

  limit(value: number) {
    this.operation.limitValue = value;
    return this;
  }

  offset(value: number) {
    this.operation.offsetValue = value;
    return this;
  }

  then<TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.db.rowsFor(this.operation.table)).then(onfulfilled, onrejected);
  }
}

class InsertBuilder {
  constructor(private readonly operation: Operation) {}

  values(payload: unknown) {
    this.operation.valuesPayload = payload;
    return this;
  }

  onConflictDoUpdate(config: unknown) {
    this.operation.conflictConfig = config;
    return Promise.resolve();
  }
}

class UpdateBuilder {
  constructor(
    private readonly db: FakeDb,
    private readonly operation: Operation
  ) {}

  set(payload: unknown) {
    this.operation.setPayload = payload;
    return this;
  }

  where(condition: unknown) {
    this.operation.whereArgs.push(condition);
    return this;
  }

  returning() {
    return Promise.resolve(this.db.updateRows);
  }
}

class FakeDb {
  readonly operations: Operation[] = [];
  readonly tableRows = new Map<unknown, unknown[]>();
  updateRows: unknown[] = [];

  select() {
    const operation: Operation = { kind: "select", whereArgs: [] };
    this.operations.push(operation);
    return new SelectBuilder(this, operation);
  }

  insert(table: unknown) {
    const operation: Operation = { kind: "insert", table, whereArgs: [] };
    this.operations.push(operation);
    return new InsertBuilder(operation);
  }

  update(table: unknown) {
    const operation: Operation = { kind: "update", table, whereArgs: [] };
    this.operations.push(operation);
    return new UpdateBuilder(this, operation);
  }

  rowsFor(table: unknown) {
    return this.tableRows.get(table) ?? [];
  }
}

const session: StudentSession = {
  kind: "student",
  accessCodeId: "access-1",
  studentName: "Ada Lovelace",
  normalizedStudentName: "ada lovelace",
  expiresAt: Date.now() + 60_000
};

const attemptRow = {
  id: "attempt-1",
  paperId: "paper-1",
  paperVersionId: "version-1",
  accessCodeId: session.accessCodeId,
  studentName: session.studentName,
  normalizedStudentName: session.normalizedStudentName,
  attemptNumber: 1,
  status: "in_progress",
  startedAt: new Date("2026-06-29T00:00:00.000Z"),
  submittedAt: null,
  lastSeenAt: new Date("2026-06-29T00:00:00.000Z"),
  elapsedSeconds: 7
};

const paperRow = {
  id: "paper-1",
  title: "Computing paper",
  syllabus: "G3 Computing",
  totalMarks: 10
};

const questionRow = {
  id: "question-1",
  paperId: "paper-1",
  paperVersionId: "version-1",
  externalId: "q1",
  number: "1",
  title: "Algorithms",
  marks: 5,
  outcomeId: null,
  variantGroupId: null,
  targetAnswerId: null,
  difficulty: null,
  stimulus: [],
  position: 1
};

const otherQuestionRow = {
  ...questionRow,
  id: "question-2",
  externalId: "q2",
  number: "2",
  title: "Networks",
  position: 2
};

const shortTextPart = {
  id: "part-a",
  questionId: questionRow.id,
  paperVersionId: "version-1",
  externalId: "q1a",
  label: "a",
  type: "short_text",
  prompt: "Name the variable.",
  marks: 2,
  outcomeId: null,
  variantGroupId: null,
  targetAnswerId: null,
  difficulty: null,
  stimulus: [],
  responseSchema: { kind: "short_text", lines: 2 },
  markingSchema: {
    mode: "exact",
    acceptedAnswers: ["secret accepted answer"]
  },
  studentFeedbackPolicy: null,
  position: 1
};

const tablePart = {
  ...shortTextPart,
  id: "part-b",
  externalId: "q1b",
  label: "b",
  type: "code_output_table",
  prompt: "Trace the code.",
  marks: 3,
  responseSchema: {
    kind: "code_output_table",
    rows: [
      { id: "trace", label: "Trace" },
      { id: "output", label: "Output" }
    ]
  },
  markingSchema: {
    mode: "code_output_table",
    rows: [{ id: "trace", expectedOutput: "secret expected output" }]
  },
  position: 2
};

describe("student question data paths", () => {
  let db: FakeDb;

  beforeEach(() => {
    db = new FakeDb();
    dbMocks.getDb.mockReturnValue(db);
  });

  it("saves every visible part answer with one bulk upsert and no saved-answer read", async () => {
    db.tableRows.set(attempts, [attemptRow]);
    db.tableRows.set(questions, [questionRow]);
    db.tableRows.set(questionParts, [shortTextPart, tablePart]);
    db.updateRows = [{ ...attemptRow, elapsedSeconds: 42 }];

    const formData = new FormData();
    formData.set("part-part-a", "count");
    formData.set("part-part-b-row-trace", "1, 2, 3");
    formData.set("part-part-b-row-output", "done");
    formData.set("elapsedSeconds", "42");

    await saveQuestionAnswers("attempt-1", 1, formData, session);

    const questionSelect = db.operations.find(
      (operation) => operation.kind === "select" && operation.table === questions
    );
    const insertOperation = db.operations.find(
      (operation) => operation.kind === "insert" && operation.table === partAnswers
    );
    const updateOperation = db.operations.find(
      (operation) => operation.kind === "update" && operation.table === attempts
    );

    expect(questionSelect).toMatchObject({ limitValue: 1, offsetValue: 0 });
    expect(db.operations.some((operation) => operation.kind === "select" && operation.table === partAnswers)).toBe(
      false
    );
    expect(insertOperation?.valuesPayload).toEqual([
      expect.objectContaining({
        attemptId: "attempt-1",
        questionId: "question-1",
        questionPartId: "part-a",
        answer: { value: "count" },
        markingStatus: "pending",
        markingSource: "auto",
        score: null,
        studentFeedback: null,
        tutorRationale: null,
        missingRubricPoints: [],
        exactMarkingDetails: null,
        markedAt: null
      }),
      expect.objectContaining({
        attemptId: "attempt-1",
        questionId: "question-1",
        questionPartId: "part-b",
        answer: { rows: { trace: "1, 2, 3", output: "done" } },
        markingStatus: "pending",
        markingSource: "auto"
      })
    ]);
    expect(updateOperation?.setPayload).toEqual(
      expect.objectContaining({
        elapsedSeconds: 42
      })
    );
  });

  it("restores saved visible answers without exposing marking metadata", async () => {
    db.tableRows.set(attempts, [attemptRow]);
    db.tableRows.set(papers, [paperRow]);
    db.tableRows.set(questions, [questionRow, otherQuestionRow]);
    db.tableRows.set(questionParts, [shortTextPart]);
    db.tableRows.set(partAnswers, [
      {
        id: "answer-1",
        attemptId: "attempt-1",
        questionId: "question-1",
        questionPartId: "part-a",
        answer: { value: "saved answer" },
        score: 2,
        maxScore: 2,
        markingStatus: "marked",
        markingSource: "manual",
        studentFeedback: "private student feedback marker",
        tutorRationale: "private tutor rationale marker",
        missingRubricPoints: ["private rubric marker"],
        exactMarkingDetails: { accepted: "private exact marker" },
        markedAt: new Date("2026-06-29T00:05:00.000Z"),
        updatedAt: new Date("2026-06-29T00:05:00.000Z")
      }
    ]);

    const data = await getStudentQuestion("attempt-1", 1, session);
    const serializedParts = JSON.stringify(data.parts);

    expect(data.parts).toHaveLength(1);
    expect(data.parts[0]).toEqual(
      expect.objectContaining({
        id: "part-a",
        answer: { value: "saved answer" }
      })
    );
    expect(serializedParts).not.toContain("secret accepted answer");
    expect(serializedParts).not.toContain("private student feedback marker");
    expect(serializedParts).not.toContain("private tutor rationale marker");
    expect(serializedParts).not.toContain("private rubric marker");
    expect(serializedParts).not.toContain("private exact marker");
    expect(db.operations.some((operation) => operation.kind === "insert")).toBe(false);
  });
});
