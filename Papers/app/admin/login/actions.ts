"use server";

import { redirect } from "next/navigation";
import { clearTutorSession, setTutorSession } from "@/lib/auth/session";
import { verifyTutorPassword } from "@/lib/auth/password";

export async function loginTutorAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const valid = await verifyTutorPassword(password);

  if (!valid) {
    redirect("/admin/login?error=invalid");
  }

  setTutorSession();
  redirect("/admin/import");
}

export async function logoutTutorAction() {
  clearTutorSession();
  redirect("/admin/login");
}
