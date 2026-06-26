import type { MarkingSchema, ResponseSchema, Stimulus } from "@/lib/domain";

type PresentablePart = {
  id: string;
  label: string;
  prompt: string;
  stimulus: Stimulus[];
};

export function normalizeChoicePart({
  prompt,
  responseSchema,
  stimulus
}: {
  prompt: string;
  responseSchema: ResponseSchema | null;
  stimulus: Stimulus[];
}) {
  if (
    responseSchema?.kind !== "structured_response" ||
    !/tick all applicable boxes?/i.test(prompt)
  ) {
    return { responseSchema, stimulus };
  }

  const optionTableIndex = stimulus.findIndex(
    (item) =>
      item.type === "table" &&
      item.columns.length === 1 &&
      item.columns[0].trim().toLowerCase() === "option" &&
      item.rows.length >= 2 &&
      item.rows.every((row) => row.length === 1 && row[0].trim().length > 0)
  );

  if (optionTableIndex < 0) {
    return { responseSchema, stimulus };
  }

  const optionTable = stimulus[optionTableIndex];

  if (optionTable.type !== "table") {
    return { responseSchema, stimulus };
  }

  return {
    responseSchema: {
      kind: "multiple_choice" as const,
      options: optionTable.rows.map(([label]) => ({ value: label, label }))
    },
    stimulus: stimulus.filter((_, index) => index !== optionTableIndex)
  };
}

export function moveQuestionCodeStimuliToTargetPart({
  parts,
  questionNumber,
  questionStimulus
}: {
  parts: PresentablePart[];
  questionNumber: string;
  questionStimulus: Stimulus[];
}) {
  const partStimulusById = new Map(parts.map((part) => [part.id, part.stimulus]));

  if (questionNumber !== "2") {
    return { questionStimulus, partStimulusById };
  }

  const codeStimuli = questionStimulus.filter((stimulus) => stimulus.type === "code");

  if (!codeStimuli.length) {
    return { questionStimulus, partStimulusById };
  }

  const targetPart = parts.find(
    (part) =>
      part.label === "2(b)" ||
      /program.+execut/i.test(part.prompt) ||
      /identify one bug/i.test(part.prompt)
  );

  if (!targetPart || targetPart.stimulus.some((stimulus) => stimulus.type === "code")) {
    return { questionStimulus, partStimulusById };
  }

  partStimulusById.set(targetPart.id, [...codeStimuli, ...targetPart.stimulus]);

  return {
    questionStimulus: questionStimulus.filter((stimulus) => stimulus.type !== "code"),
    partStimulusById
  };
}

export function displayQuestionTitle(title: string) {
  if (title === "Flowcharts And Code") {
    return "Team Qualification Algorithm";
  }

  if (title === "Flowcharts And Iteration") {
    return "Countdown Algorithm";
  }

  return title;
}

export function normalizePartMarkingSchema({
  label,
  markingSchema
}: {
  label: string;
  markingSchema: MarkingSchema;
}): MarkingSchema {
  if (
    label === "4(b)" &&
    markingSchema.mode === "error_correction" &&
    String(markingSchema.expectedLineNumber) === "04" &&
    markingSchema.acceptedCorrectedLines.includes("    print(x)")
  ) {
    return {
      ...markingSchema,
      lineNumberMarks: 0,
      correctionMarks: 1
    };
  }

  return markingSchema;
}
