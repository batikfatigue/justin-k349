export const partTypes = [
  "single_choice",
  "multiple_choice",
  "short_text",
  "structured_response",
  "code_output_table",
  "error_correction",
  "flowchart_interpretation",
  "code_writing"
] as const;

export const markingModes = ["exact", "code_output_table", "error_correction", "rubric_ai"] as const;
export const markingSources = ["auto", "manual"] as const;

export const stimulusTypes = ["text", "code", "table", "expected_output", "flowchart"] as const;

export type PartType = (typeof partTypes)[number];
export type MarkingMode = (typeof markingModes)[number];
export type MarkingSource = (typeof markingSources)[number];
export type StimulusType = (typeof stimulusTypes)[number];

export type TextStimulus = {
  type: "text";
  title?: string;
  text: string;
};

export type CodeStimulus = {
  type: "code";
  title?: string;
  language?: string;
  code: string;
};

export type TableStimulus = {
  type: "table";
  title?: string;
  columns: string[];
  rows: string[][];
};

export type ExpectedOutputStimulus = {
  type: "expected_output";
  title?: string;
  output: string;
};

export type FlowchartStimulus = {
  type: "flowchart";
  title?: string;
  sourceImage?: string;
  nodes: Array<{
    id: string;
    kind: "terminal" | "input" | "output" | "process" | "decision";
    text: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
};

export type Stimulus =
  | TextStimulus
  | CodeStimulus
  | TableStimulus
  | ExpectedOutputStimulus
  | FlowchartStimulus;

export type ResponseSchema =
  | {
      kind: "single_choice";
      options: Array<{ value: string; label: string }>;
    }
  | {
      kind: "multiple_choice";
      options: Array<{ value: string; label: string }>;
    }
  | {
      kind: "short_text" | "structured_response" | "flowchart_interpretation" | "code_writing";
      lines?: number;
      language?: string;
    }
  | {
      kind: "code_output_table";
      rows: Array<{ id: string; label: string; prompt?: string }>;
    }
  | {
      kind: "error_correction";
      showLineNumber?: boolean;
      showCorrectedLine?: boolean;
    };

export type ExactMarkingSchema = {
  mode: "exact";
  acceptedAnswers: Array<string | number | boolean>;
  caseSensitive?: boolean;
};

export type CodeOutputTableMarkingSchema = {
  mode: "code_output_table";
  rows: Array<{
    id: string;
    label?: string;
    expectedOutput: string | number | boolean;
    marks?: number;
  }>;
  caseSensitive?: boolean;
};

export type ErrorCorrectionMarkingSchema = {
  mode: "error_correction";
  expectedLineNumber: string | number;
  acceptedCorrectedLines: string[];
  lineNumberMarks?: number;
  correctionMarks?: number;
  caseSensitive?: boolean;
};

export type RubricAiMarkingSchema = {
  mode: "rubric_ai";
  modelAnswer: string;
  rubricPoints: Array<{
    id?: string;
    text: string;
    marks?: number;
  }>;
  maxScore?: number;
};

export type MarkingSchema =
  | ExactMarkingSchema
  | CodeOutputTableMarkingSchema
  | ErrorCorrectionMarkingSchema
  | RubricAiMarkingSchema;

export type ImportedPaper = {
  schemaVersion: "1.0";
  paperId: string;
  title: string;
  syllabus: string;
  mode: "practice";
  status: "draft" | "published" | "archived";
  totalMarks: number;
  accessCodes: Array<{ code: string; label: string }>;
  questions: ImportedQuestion[];
};

export type ImportedQuestion = {
  id: string;
  number: string;
  title: string;
  marks: number;
  outcomeId?: string;
  variantGroupId?: string;
  targetAnswerId?: string;
  difficulty?: string;
  stimulus?: Stimulus[];
  parts: ImportedPart[];
};

export type ImportedPart = {
  id: string;
  label: string;
  type: PartType;
  prompt: string;
  marks: number;
  outcomeId?: string;
  variantGroupId?: string;
  targetAnswerId?: string;
  difficulty?: string;
  stimulus?: Stimulus[];
  response?: ResponseSchema;
  marking: MarkingSchema;
  studentFeedbackPolicy?: string;
};

export type StudentAnswer =
  | string
  | {
      value?: string;
      values?: string[];
      rows?: Record<string, string>;
      lineNumber?: string;
      correctedLine?: string;
    };

export type MarkingStatus = "pending" | "marked" | "failed";

export type MarkingResult = {
  status: MarkingStatus;
  score: number;
  maxScore: number;
  studentFeedback: string;
  tutorRationale?: string;
  missingRubricPoints?: string[];
  exactMarkingDetails?: unknown;
};
