"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTutorSession } from "@/lib/auth/session";
import { deleteAdminPaperWithConfirmation } from "@/lib/admin/papers";
import { importPaper } from "@/lib/import/import-paper";
import { parsePaperJsonText } from "@/lib/import/k349-schema";
import type { PaperUpdateFormState } from "./form-state";

export async function updateSelectedPaperAction(
  selectedPaperId: string,
  _previousState: PaperUpdateFormState,
  formData: FormData
): Promise<PaperUpdateFormState> {
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

  if (parsed.paper.paperId !== selectedPaperId) {
    return {
      status: "error",
      message: "The replacement JSON is for a different paper.",
      errors: [`Expected paperId '${selectedPaperId}', but received '${parsed.paper.paperId}'.`],
      jsonText
    };
  }

  if (intent === "validate") {
    return {
      status: "success",
      message: "The paper JSON is valid for this paper.",
      summary: parsed.summary,
      jsonText
    };
  }

  const result = await importPaper(parsed.paper);

  revalidatePath("/admin/papers");
  revalidatePath(`/admin/papers/${selectedPaperId}`);
  redirect(`/admin/papers?updated=${encodeURIComponent(result.paperId)}`);
}

export async function deletePaperAction(formData: FormData) {
  requireTutorSession();

  const paperId = String(formData.get("paperId") ?? "");
  const confirmedAttemptCount = Number(formData.get("confirmedAttemptCount"));

  if (!paperId) {
    redirect("/admin/papers?delete=blocked&reason=missing_paper");
  }

  if (!Number.isInteger(confirmedAttemptCount) || confirmedAttemptCount < 0) {
    redirect(
      `/admin/papers?delete=blocked&paperId=${encodeURIComponent(paperId)}&reason=invalid_confirmation`
    );
  }

  const result = await deleteAdminPaperWithConfirmation(paperId, confirmedAttemptCount);

  revalidatePath("/admin/papers");

  if (result.ok) {
    redirect(`/admin/papers?deleted=${encodeURIComponent(result.paperId)}`);
  }

  const params = new URLSearchParams({
    delete: "blocked",
    paperId,
    reason: result.reason
  });

  if (result.reason === "stale_attempt_count") {
    params.set("attempts", String(result.attemptCount));
    params.set("confirmed", String(result.confirmedAttemptCount));
  }

  redirect(`/admin/papers?${params.toString()}`);
}
