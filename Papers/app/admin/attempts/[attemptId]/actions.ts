"use server";

import { redirect } from "next/navigation";
import { requireTutorSession } from "@/lib/auth/session";
import { resubmitAttemptPartToAiMarking } from "@/lib/admin/ai-remark";
import { manuallyOverrideAttemptPartMark } from "@/lib/admin/manual-override";

export async function resubmitAiMarkAction(formData: FormData) {
  requireTutorSession();

  const attemptId = String(formData.get("attemptId") ?? "");
  const questionPartId = String(formData.get("questionPartId") ?? "");
  const result = await resubmitAttemptPartToAiMarking(attemptId, questionPartId);

  const outcome = result.ok ? "success" : "failed";
  const reason = result.ok ? "" : `&reason=${encodeURIComponent(result.reason)}`;

  redirect(`/admin/attempts/${attemptId}?remark=${outcome}${reason}`);
}

export async function manualOverrideMarkAction(formData: FormData) {
  requireTutorSession();

  const attemptId = String(formData.get("attemptId") ?? "");
  const questionPartId = String(formData.get("questionPartId") ?? "");
  const rawScore = formData.get("score");
  const score = typeof rawScore === "string" && rawScore.trim() !== "" ? Number(rawScore) : Number.NaN;
  const studentFeedback = String(formData.get("studentFeedback") ?? "");
  const tutorRationale = String(formData.get("tutorRationale") ?? "");
  const result = await manuallyOverrideAttemptPartMark({
    attemptId,
    questionPartId,
    score,
    studentFeedback,
    tutorRationale
  });

  const outcome = result.ok ? "success" : "failed";
  const reason = result.ok ? "" : `&overrideReason=${encodeURIComponent(result.reason)}`;

  redirect(`/admin/attempts/${attemptId}?override=${outcome}${reason}`);
}
