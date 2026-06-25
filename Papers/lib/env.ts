import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  DATABASE_URL: optionalUrl,
  DIRECT_DATABASE_URL: optionalUrl,
  GEMINI_API_KEY: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  GEMINI_MODEL: z.string().trim().default("gemini-1.5-flash"),
  TUTOR_PASSWORD_HASH: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  SESSION_SECRET: z
    .string()
    .trim()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function requireEnv<K extends keyof AppEnv>(name: K): NonNullable<AppEnv[K]> {
  const value = getEnv()[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value as NonNullable<AppEnv[K]>;
}

export function getRuntimeDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getMigrationDatabaseUrl() {
  return getEnv().DIRECT_DATABASE_URL ?? requireEnv("DATABASE_URL");
}
