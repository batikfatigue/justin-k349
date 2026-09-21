CREATE INDEX IF NOT EXISTS "attempts_started_at_idx" ON "attempts" USING btree ("started_at" DESC, "id" DESC);
