"use server";

import { requireTutorSession } from "@/lib/auth/session";
import { importPaper } from "@/lib/import/import-paper";
import { parsePaperJsonText, type PaperValidationSummary } from "@/lib/import/k349-schema";

export type ImportFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: string[];
  summary?: PaperValidationSummary;
  jsonText?: string;
};

export const initialImportFormState: ImportFormState = {
  status: "idle",
  jsonText: ""
};

export async function importPaperAction(
  _previousState: ImportFormState,
  formData: FormData
): Promise<ImportFormState> {
  requireTutorSession();

  const intent = String(formData.get("intent") ?? "validate");
  const jsonText = String(formData.get("paperJson") ?? "");
  const parsed = parsePaperJsonText(jsonText);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "The paper JSON is not valid.",
      errors: parsed.errors,
      jsonText
    };
  }

  if (intent === "validate") {
    return {
      status: "success",
      message: "The paper can be imported.",
      summary: parsed.summary,
      jsonText
    };
  }

  const result = await importPaper(parsed.paper);

  return {
    status: "success",
    message: `Imported ${result.paperId} as version ${result.versionNumber}.`,
    summary: result.summary,
    jsonText
  };
}
