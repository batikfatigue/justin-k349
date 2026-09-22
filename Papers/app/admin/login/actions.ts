"use server";

import { redirect } from "next/navigation";
import { clearTutorSession, setTutorSession } from "@/lib/auth/session";
import { clearFailures, isThrottled, recordFailure } from "@/lib/auth/throttle";
import { verifyTutorPassword } from "@/lib/auth/password";

export async function loginTutorAction(formData: FormData) {
  if (await isThrottled("tutor")) {
    redirect("/admin/login?error=throttled");
  }

  const password = String(formData.get("password") ?? "");
  const result = await verifyTutorPassword(password);

  if (!result.ok) {
    if (result.reason === "invalid") {
      await recordFailure("tutor");
    }
    redirect(`/admin/login?error=${result.reason}`);
  }

  await clearFailures("tutor");
  setTutorSession();
  redirect("/admin/import");
}

export async function logoutTutorAction() {
  clearTutorSession();
  redirect("/admin/login");
}
