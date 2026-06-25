import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

function hmac(value: string) {
  return createHmac("sha256", requireEnv("SESSION_SECRET")).update(value).digest("base64url");
}

export function hashAccessCode(code: string) {
  return hmac(code.trim().toUpperCase());
}

export function signValue(value: string) {
  return `${value}.${hmac(value)}`;
}

export function verifySignedValue(signedValue: string | undefined) {
  if (!signedValue) {
    return null;
  }

  const separator = signedValue.lastIndexOf(".");

  if (separator < 1) {
    return null;
  }

  const value = signedValue.slice(0, separator);
  const signature = signedValue.slice(separator + 1);
  const expected = hmac(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer) ? value : null;
}

export function normalizeStudentName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
