import type { PaperValidationSummary } from "@/lib/import/k349-schema";

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
