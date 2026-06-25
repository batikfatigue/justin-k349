"use server";

import { redirect } from "next/navigation";
import {
  clearStudentSession,
  requireStudentSession,
  setStudentSession
} from "@/lib/auth/session";
import {
  createStudentAttempt,
  resolveAccessCode,
  saveQuestionAnswers,
  submitStudentAttempt
} from "@/lib/student/data";

export async function enterStudentAccessAction(formData: FormData) {
  const accessCode = String(formData.get("accessCode") ?? "");
  const studentName = String(formData.get("studentName") ?? "").trim();

  if (!studentName) {
    redirect("/?error=name");
  }

  const code = await resolveAccessCode(accessCode);

  if (!code) {
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
