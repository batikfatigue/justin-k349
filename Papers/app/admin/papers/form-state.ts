import type { PaperValidationSummary } from "@/lib/import/k349-schema";

export type PaperUpdateFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: string[];
  jsonText: string;
  summary?: PaperValidationSummary;
};

export const initialPaperUpdateFormState: PaperUpdateFormState = {
  status: "idle",
  message: "",
  jsonText: ""
};
