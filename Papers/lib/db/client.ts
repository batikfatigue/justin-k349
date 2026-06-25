import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getMigrationDatabaseUrl, getRuntimeDatabaseUrl } from "@/lib/env";
import * as schema from "@/lib/db/schema";

type RuntimeDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var practicePaperSql: postgres.Sql | undefined;
  var practicePaperDb: RuntimeDb | undefined;
}

function createRuntimeSql() {
  return postgres(getRuntimeDatabaseUrl(), {
    max: 5,
    prepare: false,
    idle_timeout: 20
  });
}

export function getDb() {
  if (!globalThis.practicePaperSql || !globalThis.practicePaperDb) {
    globalThis.practicePaperSql = createRuntimeSql();
    globalThis.practicePaperDb = drizzle(globalThis.practicePaperSql, { schema });
  }

  return globalThis.practicePaperDb;
}

export function createMigrationSql() {
  return postgres(getMigrationDatabaseUrl(), {
    max: 1,
    prepare: false
  });
}

export type Db = ReturnType<typeof getDb>;
