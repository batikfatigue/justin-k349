import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signValue, verifySignedValue, normalizeStudentName } from "@/lib/security";

const tutorCookieName = "tutor_session";
const studentCookieName = "student_access";
const sixHours = 6 * 60 * 60;
const oneDay = 24 * 60 * 60;

type TutorSession = {
  kind: "tutor";
  expiresAt: number;
};

export type StudentSession = {
  kind: "student";
  accessCodeId: string;
  studentName: string;
  normalizedStudentName: string;
  expiresAt: number;
};

function encode<T>(payload: T) {
  return signValue(Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"));
}

function decode<T>(signedValue: string | undefined): T | null {
  const value = verifySignedValue(signedValue);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function isFresh(payload: { expiresAt: number } | null) {
  return Boolean(payload && payload.expiresAt > Date.now());
}

export function setTutorSession() {
  const payload: TutorSession = {
    kind: "tutor",
    expiresAt: Date.now() + oneDay * 1000
  };

  cookies().set(tutorCookieName, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: oneDay
  });
}

export function clearTutorSession() {
  cookies().delete(tutorCookieName);
}

export function getTutorSession() {
  const session = decode<TutorSession>(cookies().get(tutorCookieName)?.value);
  return isFresh(session) && session?.kind === "tutor" ? session : null;
}

export function requireTutorSession() {
  const session = getTutorSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export function setStudentSession(accessCodeId: string, studentName: string) {
  const trimmedName = studentName.trim().replace(/\s+/g, " ");
  const payload: StudentSession = {
    kind: "student",
    accessCodeId,
    studentName: trimmedName,
    normalizedStudentName: normalizeStudentName(trimmedName),
    expiresAt: Date.now() + sixHours * 1000
  };

  cookies().set(studentCookieName, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sixHours
  });
}

export function clearStudentSession() {
  cookies().delete(studentCookieName);
}

export function getStudentSession() {
  const session = decode<StudentSession>(cookies().get(studentCookieName)?.value);
  return isFresh(session) && session?.kind === "student" ? session : null;
}

export function requireStudentSession() {
  const session = getStudentSession();

  if (!session) {
    redirect("/");
  }

  return session;
}
