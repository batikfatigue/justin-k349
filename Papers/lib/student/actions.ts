"use server";

import { redirect } from "next/navigation";
import {
  clearStudentSession,
  requireStudentSession,
  setStudentSession
} from "@/lib/auth/session";
import {
  isRateLimited,
  recordRateLimitAttempt,
  requestClientKey
} from "@/lib/rate-limit";
import { hashAccessCode } from "@/lib/security";
import {
  createStudentAttempt,
  resolveAccessCode,
  saveQuestionAnswers,
  submitStudentAttempt
} from "@/lib/student/data";

const clientRateLimit = { limit: 120, windowMs: 5 * 60 * 1000 };
const accessCodeRateLimit = { limit: 10, windowMs: 5 * 60 * 1000 };

export async function enterStudentAccessAction(formData: FormData) {
  const accessCode = String(formData.get("accessCode") ?? "");
  const studentName = String(formData.get("studentName") ?? "").trim();
  const clientKey = `student-entry:${requestClientKey()}`;
  const codeKey = `student-code:${hashAccessCode(accessCode)}`;

  if (
    isRateLimited(clientKey, clientRateLimit.limit) ||
    isRateLimited(codeKey, accessCodeRateLimit.limit)
  ) {
    redirect("/?error=limited");
  }

  if (!studentName) {
    redirect("/?error=name");
  }

  const code = await resolveAccessCode(accessCode);

  if (!code) {
    recordRateLimitAttempt(clientKey, clientRateLimit.windowMs);
    recordRateLimitAttempt(codeKey, accessCodeRateLimit.windowMs);
    redirect("/?error=access");
  }

  setStudentSession(code.id, studentName);
  redirect("/");
}

export async function clearStudentAccessAction() {
  clearStudentSession();
  redirect("/");
}

export async function startAttemptAction(formData: FormData) {
  const session = requireStudentSession();
  const paperId = String(formData.get("paperId") ?? "");
  const attempt = await createStudentAttempt(paperId, session);

  redirect(`/attempts/${attempt.id}/questions/1`);
}

export async function saveQuestionAction(formData: FormData) {
  const session = requireStudentSession();
  const attemptId = String(formData.get("attemptId") ?? "");
  const questionNumber = Number(formData.get("questionNumber") ?? 1);
  const questionCount = Number(formData.get("questionCount") ?? 1);
  const intent = String(formData.get("intent") ?? "next");

  await saveQuestionAnswers(attemptId, questionNumber, formData, session);

  if (intent === "submit") {
    await submitStudentAttempt(attemptId, session);
    redirect(`/attempts/${attemptId}/results`);
  }

  const nextQuestion =
    intent === "previous"
      ? Math.max(1, questionNumber - 1)
      : Math.min(questionCount, questionNumber + 1);

  redirect(`/attempts/${attemptId}/questions/${nextQuestion}`);
}
