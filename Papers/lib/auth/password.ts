import "server-only";

import bcrypt from "bcryptjs";
import { requireEnv } from "@/lib/env";

export async function verifyTutorPassword(password: string) {
  const configuredHash = requireEnv("TUTOR_PASSWORD_HASH");

  if (!configuredHash.startsWith("$2")) {
    throw new Error("TUTOR_PASSWORD_HASH must be a bcrypt hash.");
  }

  return bcrypt.compare(password, configuredHash);
}
