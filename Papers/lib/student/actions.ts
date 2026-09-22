"use server";

import { redirect } from "next/navigation";
import {
  clearStudentSession,
  peekStudentSession,
  requireStudentSession,
  setStudentSession
} from "@/lib/auth/session";
import { clearFailures, isThrottled, recordFailure } from "@/lib/auth/throttle";
import {
  createStudentAttempt,
  resolveAccessCode,
  saveQuestionAnswers,
  submitStudentAttempt
} from "@/lib/student/data";

export async function enterStudentAccessAction(formData: FormData) {
  if (await isThrottled("access-code")) {
    redirect("/?error=throttled");
  }

  const accessCode = String(formData.get("accessCode") ?? "");
  const studentName = String(formData.get("studentName") ?? "").trim();

  if (!studentName) {
    redirect("/?error=name");
  }

  const code = await resolveAccessCode(accessCode);

  if (!code) {
    await recordFailure("access-code");
    redirect("/?error=access");
  }

  await clearFailures("access-code");
  setStudentSession(code.id, studentName);
  redirect("/");
}

export async function clearStudentAccessAction() {
  clearStudentSession();
  redirect("/");
}

export async function startAttemptAction(formData: FormData) {
  const session = await requireStudentSession();
  const paperId = String(formData.get("paperId") ?? "");
  const attempt = await createStudentAttempt(paperId, session);

  redirect(`/attempts/${attempt.id}/questions/1`);
}

export async function saveQuestionAction(formData: FormData) {
  const session = peekStudentSession();

  if (!session) {
    redirect("/");
  }

  const attemptId = String(formData.get("attemptId") ?? "");
  const questionNumber = Number(formData.get("questionNumber") ?? 1);
  const questionCount = Number(formData.get("questionCount") ?? 1);
  const intent = String(formData.get("intent") ?? "next");

  await saveQuestionAnswers(attemptId, questionNumber, formData, session);

  if (intent === "submit") {
    const elapsedSeconds = Number(formData.get("elapsedSeconds") ?? 0);
    await submitStudentAttempt(attemptId, elapsedSeconds, session);
    redirect(`/attempts/${attemptId}/results`);
  }

  const nextQuestion =
    intent === "previous"
      ? Math.max(1, questionNumber - 1)
      : Math.min(questionCount, questionNumber + 1);

  redirect(`/attempts/${attemptId}/questions/${nextQuestion}`);
}
