import "server-only";

import bcrypt from "bcryptjs";
import { getEnv } from "@/lib/env";

export type TutorPasswordCheck =
  | { ok: true }
  | { ok: false; reason: "invalid" | "misconfigured" };

export async function verifyTutorPassword(password: string) {
  const configuredHash = getEnv().TUTOR_PASSWORD_HASH;

  if (!configuredHash || !configuredHash.startsWith("$2")) {
    return { ok: false, reason: "misconfigured" } satisfies TutorPasswordCheck;
  }

  const matched = await bcrypt.compare(password, configuredHash);

  return matched
    ? ({ ok: true } satisfies TutorPasswordCheck)
    : ({ ok: false, reason: "invalid" } satisfies TutorPasswordCheck);
}
