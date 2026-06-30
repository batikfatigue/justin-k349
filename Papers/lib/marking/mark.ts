import type {
  CodeOutputTableMarkingSchema,
  ErrorCorrectionMarkingSchema,
  ExactMarkingSchema,
  MarkingResult,
  MarkingSchema,
  RubricAiMarkingSchema,
  Stimulus,
  StudentAnswer
} from "@/lib/domain";
import { requestGeminiMark, type GeminiGenerate } from "@/lib/marking/gemini";

export type MarkablePart = {
  id: string;
  label: string;
  type: string;
  prompt: string;
  marks: number;
  stimulus: Stimulus[];
  markingSchema: MarkingSchema;
};

export async function markPartAnswer(
  part: MarkablePart,
  answer: StudentAnswer,
  options: { generateGemini?: GeminiGenerate } = {}
): Promise<MarkingResult> {
  switch (part.markingSchema.mode) {
    case "exact":
      return markExact(answer, part.markingSchema, part.marks);
    case "code_output_table":
      return markCodeOutputTable(answer, part.markingSchema, part.marks);
    case "error_correction":
      return markErrorCorrection(answer, part.markingSchema, part.marks);
    case "rubric_ai":
      return markRubricAi(part, answer, part.markingSchema, options.generateGemini);
    default:
      return exhaustive(part.markingSchema);
  }
}

export function markExact(
  answer: StudentAnswer,
  schema: ExactMarkingSchema,
  maxScore: number
): MarkingResult {
  const submitted = answerToString(answer);
  const matched = schema.acceptedAnswers.some(
    (acceptedAnswer) => normalize(submitted, schema.caseSensitive) === normalize(acceptedAnswer, schema.caseSensitive)
  );

  return {
    status: "marked",
    score: matched ? maxScore : 0,
    maxScore,
    studentFeedback: matched
      ? "Your response matched the expected answer."
      : "Your response needs review against the question.",
    tutorRationale: matched
      ? "Exact marker matched one accepted answer."
      : "Exact marker found no accepted-answer match.",
    exactMarkingDetails: {
      submitted,
      acceptedAnswers: schema.acceptedAnswers,
      caseSensitive: schema.caseSensitive ?? false,
      matched
    },
    missingRubricPoints: []
  };
}

export function markCodeOutputTable(
  answer: StudentAnswer,
  schema: CodeOutputTableMarkingSchema,
  maxScore: number
): MarkingResult {
  const rows = typeof answer === "object" && answer && "rows" in answer ? answer.rows ?? {} : {};
  const rowResults = schema.rows.map((row) => {
    const submitted = rows[row.id] ?? "";
    const matched = normalize(submitted, schema.caseSensitive) === normalize(row.expectedOutput, schema.caseSensitive);
    const marks = row.marks ?? 1;

    return {
      id: row.id,
      label: row.label,
      submitted,
      expectedOutput: row.expectedOutput,
      marks,
      awarded: matched ? marks : 0,
      matched
    };
  });
  const score = rowResults.reduce((sum, row) => sum + row.awarded, 0);

  return {
    status: "marked",
    score,
    maxScore,
    studentFeedback:
      score === maxScore
        ? "All output rows were marked correct."
        : `${rowResults.filter((row) => row.matched).length} of ${rowResults.length} output rows matched.`,
    tutorRationale: "Code-output table was marked row by row against expected output.",
    exactMarkingDetails: {
      rows: rowResults,
      caseSensitive: schema.caseSensitive ?? false
    },
    missingRubricPoints: []
  };
}

export function markErrorCorrection(
  answer: StudentAnswer,
  schema: ErrorCorrectionMarkingSchema,
  maxScore: number
): MarkingResult {
  const submittedLineNumber = typeof answer === "object" && answer ? answer.lineNumber ?? "" : "";
  const submittedCorrectedLine = typeof answer === "object" && answer ? answer.correctedLine ?? "" : "";
  const lineNumberMarks = schema.lineNumberMarks ?? 1;
  const correctionMarks = schema.correctionMarks ?? Math.max(maxScore - lineNumberMarks, 0);
  const lineMatched = normalize(submittedLineNumber, true) === normalize(schema.expectedLineNumber, true);
  const correctionMatched = schema.acceptedCorrectedLines.some(
    (line) =>
      normalizeCodeCorrection(submittedCorrectedLine, schema.caseSensitive) ===
      normalizeCodeCorrection(line, schema.caseSensitive)
  );
  const score = (lineMatched ? lineNumberMarks : 0) + (correctionMatched ? correctionMarks : 0);

  return {
    status: "marked",
    score,
    maxScore,
    studentFeedback:
      score === maxScore
        ? "The error location and correction were marked correct."
        : "One or more parts of the correction need review.",
    tutorRationale: "Error correction was marked against expected line number and accepted corrected-line alternatives.",
    exactMarkingDetails: {
      submittedLineNumber,
      submittedCorrectedLine,
      expectedLineNumber: schema.expectedLineNumber,
      acceptedCorrectedLines: schema.acceptedCorrectedLines,
      lineMatched,
      correctionMatched,
      lineNumberMarks,
      correctionMarks
    },
    missingRubricPoints: []
  };
}

async function markRubricAi(
  part: MarkablePart,
  answer: StudentAnswer,
  schema: RubricAiMarkingSchema,
  generateGemini?: GeminiGenerate
): Promise<MarkingResult> {
  const maxScore = schema.maxScore ?? part.marks;

  if (isBlankStudentAnswer(answer)) {
    return {
      status: "marked",
      score: 0,
      maxScore,
      studentFeedback: "No answer was provided, so this response earned 0 marks.",
      tutorRationale: "Rubric AI marking was skipped because the submitted answer was blank.",
      missingRubricPoints: [],
      exactMarkingDetails: null
    };
  }

  try {
    const result = await requestGeminiMark(
      {
        prompt: part.prompt,
        visibleStimuli: part.stimulus,
        studentAnswer: answer,
        marking: schema,
        maxScore
      },
      generateGemini
    );

    return {
      status: "marked",
      score: Math.round(result.score),
      maxScore,
      studentFeedback: result.studentFeedback,
      tutorRationale: result.tutorRationale,
      missingRubricPoints: result.missingRubricPoints,
      exactMarkingDetails: null
    };
  } catch (error) {
    return {
      status: "failed",
      score: 0,
      maxScore: schema.maxScore ?? part.marks,
      studentFeedback: "This answer was saved, but marking is pending review.",
      tutorRationale: error instanceof Error ? error.message : "Gemini marking failed.",
      missingRubricPoints: [],
      exactMarkingDetails: null
    };
  }
}

export function isBlankStudentAnswer(answer: StudentAnswer) {
  return answerToString(answer).trim().length === 0;
}

function answerToString(answer: StudentAnswer) {
  if (typeof answer === "string") {
    return answer;
  }

  if (typeof answer === "object" && answer) {
    if (Array.isArray(answer.values)) {
      return [...answer.values].sort().join(";");
    }

    return answer.value ?? "";
  }

  return "";
}

function normalize(value: string | number | boolean, caseSensitive = false) {
  const text = String(value).trim();
  return caseSensitive ? text : text.toLowerCase();
}

function normalizeCodeCorrection(value: string, caseSensitive = false) {
  const text = value.replace(/\t/g, "    ").trimEnd();
  return caseSensitive ? text : text.toLowerCase();
}

function exhaustive(value: never): never {
  throw new Error(`Unsupported marking schema: ${JSON.stringify(value)}`);
}
