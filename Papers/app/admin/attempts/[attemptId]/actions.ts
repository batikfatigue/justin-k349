"use server";

import { redirect } from "next/navigation";
import { requireTutorSession } from "@/lib/auth/session";
import { resubmitAttemptPartToAiMarking } from "@/lib/admin/ai-remark";

export async function resubmitAiMarkAction(formData: FormData) {
  requireTutorSession();

  const attemptId = String(formData.get("attemptId") ?? "");
  const questionPartId = String(formData.get("questionPartId") ?? "");
  const result = await resubmitAttemptPartToAiMarking(attemptId, questionPartId);

  const outcome = result.ok ? "success" : "failed";
  const reason = result.ok ? "" : `&reason=${encodeURIComponent(result.reason)}`;

  redirect(`/admin/attempts/${attemptId}?remark=${outcome}${reason}`);
}
