"use server";

import { redirect } from "next/navigation";
import { clearTutorSession, setTutorSession } from "@/lib/auth/session";
import { verifyTutorPassword } from "@/lib/auth/password";
import {
  isRateLimited,
  recordRateLimitAttempt,
  requestClientKey,
  resetRateLimit
} from "@/lib/rate-limit";

const tutorLoginRateLimit = { limit: 5, windowMs: 5 * 60 * 1000 };

export async function loginTutorAction(formData: FormData) {
  const rateLimitKey = `tutor-login:${requestClientKey()}`;

  if (isRateLimited(rateLimitKey, tutorLoginRateLimit.limit)) {
    redirect("/admin/login?error=rate_limited");
  }

  const password = String(formData.get("password") ?? "");
  const result = await verifyTutorPassword(password);

  if (!result.ok) {
    if (result.reason === "invalid") {
      recordRateLimitAttempt(rateLimitKey, tutorLoginRateLimit.windowMs);
    }

    redirect(`/admin/login?error=${result.reason}`);
  }

  resetRateLimit(rateLimitKey);
  setTutorSession();
  redirect("/admin/import");
}

export async function logoutTutorAction() {
  clearTutorSession();
  redirect("/admin/login");
}
