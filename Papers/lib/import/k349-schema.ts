import { z } from "zod";
import {
  markingModes,
  partTypes,
  stimulusTypes,
  type ImportedPaper,
  type ImportedQuestion,
  type MarkingSchema,
  type Stimulus
} from "@/lib/domain";

const nonEmpty = z.string().trim().min(1);
const positiveMarks = z.number().int().positive();
const nonNegativeMarks = z.number().int().nonnegative();

const textStimulusSchema = z.object({
  type: z.literal("text"),
  title: nonEmpty.optional(),
  text: nonEmpty
});

const codeStimulusSchema = z.object({
  type: z.literal("code"),
  title: nonEmpty.optional(),
  language: nonEmpty.optional(),
  code: z.string()
});

const tableStimulusSchema = z.object({
  type: z.literal("table"),
  title: nonEmpty.optional(),
  columns: z.array(nonEmpty).min(1),
  rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]).transform(String))).min(1)
});

const expectedOutputStimulusSchema = z.object({
  type: z.literal("expected_output"),
  title: nonEmpty.optional(),
  output: z.string()
});

const flowchartNodeSchema = z.object({
  id: nonEmpty,
  kind: z.enum(["terminal", "input", "output", "process", "decision"]),
  text: nonEmpty
});

const flowchartEdgeSchema = z.object({
  from: nonEmpty,
  to: nonEmpty,
  label: nonEmpty.optional()
});

const flowchartStimulusSchema = z.object({
  type: z.literal("flowchart"),
  title: nonEmpty.optional(),
  sourceImage: nonEmpty.optional(),
  nodes: z.array(flowchartNodeSchema).min(1),
  edges: z.array(flowchartEdgeSchema).min(1)
});

export const stimulusSchema = z.discriminatedUnion("type", [
  textStimulusSchema,
  codeStimulusSchema,
  tableStimulusSchema,
  expectedOutputStimulusSchema,
  flowchartStimulusSchema
]);

const responseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("single_choice"),
    options: z.array(z.object({ value: nonEmpty, label: nonEmpty })).min(2)
  }),
  z.object({
    kind: z.literal("multiple_choice"),
    options: z.array(z.object({ value: nonEmpty, label: nonEmpty })).min(2)
  }),
  z.object({
    kind: z.enum(["short_text", "structured_response", "flowchart_interpretation", "code_writing"]),
    lines: z.number().int().positive().optional(),
    language: nonEmpty.optional()
  }),
  z.object({
    kind: z.literal("code_output_table"),
    rows: z.array(z.object({ id: nonEmpty, label: nonEmpty, prompt: nonEmpty.optional() })).min(1)
  }),
  z.object({
    kind: z.literal("error_correction"),
    showLineNumber: z.boolean().optional(),
    showCorrectedLine: z.boolean().optional()
  })
]);

const answerScalar = z.union([z.string(), z.number(), z.boolean()]);

const exactMarkingSchema = z.object({
  mode: z.literal("exact"),
  acceptedAnswers: z.array(answerScalar).min(1),
  caseSensitive: z.boolean().optional()
});

const codeOutputTableMarkingSchema = z.object({
  mode: z.literal("code_output_table"),
  rows: z
    .array(
      z.object({
        id: nonEmpty,
        label: nonEmpty.optional(),
        expectedOutput: answerScalar,
        marks: positiveMarks.optional()
      })
    )
    .min(1),
  caseSensitive: z.boolean().optional()
});

const errorCorrectionMarkingSchema = z.object({
  mode: z.literal("error_correction"),
  expectedLineNumber: answerScalar,
  acceptedCorrectedLines: z.array(nonEmpty).min(1),
  lineNumberMarks: nonNegativeMarks.optional(),
  correctionMarks: nonNegativeMarks.optional(),
  caseSensitive: z.boolean().optional()
});

const rubricAiMarkingSchema = z.object({
  mode: z.literal("rubric_ai"),
  modelAnswer: nonEmpty,
  rubricPoints: z.array(z.object({ id: nonEmpty.optional(), text: nonEmpty, marks: positiveMarks.optional() })).min(1),
  maxScore: positiveMarks.optional()
});

const markingSchema = z.discriminatedUnion("mode", [
  exactMarkingSchema,
  codeOutputTableMarkingSchema,
  errorCorrectionMarkingSchema,
  rubricAiMarkingSchema
]);

const partSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  type: z.enum(partTypes),
  prompt: z.string().min(1),
  marks: positiveMarks,
  outcomeId: nonEmpty.optional(),
  variantGroupId: nonEmpty.optional(),
  targetAnswerId: nonEmpty.optional(),
  difficulty: nonEmpty.optional(),
  stimulus: z.array(stimulusSchema).default([]),
  response: responseSchema.optional(),
  marking: markingSchema,
  studentFeedbackPolicy: nonEmpty.optional()
});

const questionSchema = z.object({
  id: nonEmpty,
  number: nonEmpty,
  title: nonEmpty,
  marks: positiveMarks,
  outcomeId: nonEmpty.optional(),
  variantGroupId: nonEmpty.optional(),
  targetAnswerId: nonEmpty.optional(),
  difficulty: nonEmpty.optional(),
  stimulus: z.array(stimulusSchema).default([]),
  parts: z.array(partSchema).min(1)
});

export const importedPaperSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    paperId: nonEmpty,
    title: nonEmpty,
    syllabus: nonEmpty,
    mode: z.literal("practice"),
    status: z.enum(["draft", "published", "archived"]),
    totalMarks: positiveMarks,
    accessCodes: z.array(z.object({ code: nonEmpty, label: nonEmpty })).min(1),
    questions: z.array(questionSchema).min(1)
  })
  .superRefine((paper, ctx) => {
    const questionTotal = paper.questions.reduce((total, question) => total + question.marks, 0);

    if (questionTotal !== paper.totalMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalMarks"],
        message: `Paper totalMarks is ${paper.totalMarks}, but question marks add to ${questionTotal}.`
      });
    }

    const questionIds = new Set<string>();

    paper.questions.forEach((question, questionIndex) => {
      if (questionIds.has(question.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", questionIndex, "id"],
          message: `Duplicate question id '${question.id}'.`
        });
      }

      questionIds.add(question.id);
      validateStimuli(question.stimulus ?? [], ["questions", questionIndex, "stimulus"], ctx);
      validateQuestion(question as ImportedQuestion, questionIndex, ctx);
    });
  });

function validateQuestion(
  question: ImportedQuestion,
  questionIndex: number,
  ctx: z.RefinementCtx
) {
  const partTotal = question.parts.reduce((total, part) => total + part.marks, 0);

  if (partTotal !== question.marks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["questions", questionIndex, "marks"],
      message: `Question ${question.id} declares ${question.marks} marks, but parts add to ${partTotal}.`
    });
  }

  const partIds = new Set<string>();

  question.parts.forEach((part, partIndex) => {
    if (partIds.has(part.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", questionIndex, "parts", partIndex, "id"],
        message: `Duplicate part id '${part.id}'.`
      });
    }

    partIds.add(part.id);
    validateStimuli(part.stimulus ?? [], ["questions", questionIndex, "parts", partIndex, "stimulus"], ctx);

    if (part.type === "single_choice" && part.response?.kind !== "single_choice") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", questionIndex, "parts", partIndex, "response"],
        message: "single_choice parts must provide a single_choice response with options."
      });
    }

    if (part.type === "multiple_choice" && part.response?.kind !== "multiple_choice") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", questionIndex, "parts", partIndex, "response"],
        message: "multiple_choice parts must provide a multiple_choice response with options."
      });
    }

    validateMarkingAgainstMarks(part.marking, part.marks, ["questions", questionIndex, "parts", partIndex, "marking"], ctx);
  });
}

function validateStimuli(
  stimuli: Stimulus[],
  path: Array<string | number>,
  ctx: z.RefinementCtx
) {
  stimuli.forEach((stimulus, stimulusIndex) => {
    if (stimulus.type !== "flowchart") {
      return;
    }

    const nodeIds = new Set(stimulus.nodes.map((node) => node.id));

    stimulus.nodes.forEach((node, nodeIndex) => {
      if (stimulus.nodes.findIndex((other) => other.id === node.id) !== nodeIndex) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, stimulusIndex, "nodes", nodeIndex, "id"],
          message: `Duplicate flowchart node id '${node.id}'.`
        });
      }
    });

    stimulus.edges.forEach((edge, edgeIndex) => {
      if (!nodeIds.has(edge.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, stimulusIndex, "edges", edgeIndex, "from"],
          message: `Flowchart edge references unknown source node '${edge.from}'.`
        });
      }

      if (!nodeIds.has(edge.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path, stimulusIndex, "edges", edgeIndex, "to"],
          message: `Flowchart edge references unknown target node '${edge.to}'.`
        });
      }
    });
  });
}

function validateMarkingAgainstMarks(
  marking: MarkingSchema,
  partMarks: number,
  path: Array<string | number>,
  ctx: z.RefinementCtx
) {
  if (marking.mode === "code_output_table") {
    const rowMarks = marking.rows.map((row) => row.marks ?? 1);
    const total = rowMarks.reduce((sum, marks) => sum + marks, 0);

    if (total !== partMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: `code_output_table row marks add to ${total}, but part has ${partMarks} marks.`
      });
    }
  }

  if (marking.mode === "error_correction") {
    const total = (marking.lineNumberMarks ?? 0) + (marking.correctionMarks ?? 0);

    if (total > 0 && total !== partMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: `error_correction marks add to ${total}, but part has ${partMarks} marks.`
      });
    }
  }

  if (marking.mode === "rubric_ai" && marking.maxScore && marking.maxScore !== partMarks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [...path, "maxScore"],
      message: `rubric_ai maxScore is ${marking.maxScore}, but part has ${partMarks} marks.`
    });
  }
}

export type PaperValidationSummary = {
  title: string;
  syllabus: string;
  accessCodeCount: number;
  questionCount: number;
  partCount: number;
  totalMarks: number;
};

export type PaperValidationResult =
  | {
      ok: true;
      paper: ImportedPaper;
      summary: PaperValidationSummary;
      errors: [];
    }
  | {
      ok: false;
      errors: string[];
      summary?: never;
      paper?: never;
    };

export function parsePaperJsonText(jsonText: string): PaperValidationResult {
  try {
    return validatePaperJson(JSON.parse(jsonText));
  } catch (error) {
    return {
      ok: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : "Unable to parse input."}`]
    };
  }
}

export function validatePaperJson(input: unknown): PaperValidationResult {
  const result = importedPaperSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map(formatIssue)
    };
  }

  const paper = result.data as ImportedPaper;

  return {
    ok: true,
    paper,
    summary: summarizePaper(paper),
    errors: []
  };
}

export function summarizePaper(paper: ImportedPaper): PaperValidationSummary {
  return {
    title: paper.title,
    syllabus: paper.syllabus,
    accessCodeCount: paper.accessCodes.length,
    questionCount: paper.questions.length,
    partCount: paper.questions.reduce((sum, question) => sum + question.parts.length, 0),
    totalMarks: paper.totalMarks
  };
}

export function formatIssue(issue: z.ZodIssue) {
  const path = issue.path.length > 0 ? issue.path.join(".") : "paper";
  return `${path}: ${issue.message}`;
}

export const supportedImportValues = {
  partTypes,
  stimulusTypes,
  markingModes
};
