# Deployment And Import Notes

## Required Services

- Vercel for the Next.js application.
- Supabase Postgres for durable state.
- Gemini API access for `rubric_ai` marking.

## Environment Variables

Set these in Vercel and in local `.env` files:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase transaction-pooler connection string for runtime requests. Use the pooler port and keep prepared statements disabled through the app client. |
| `DIRECT_DATABASE_URL` | Supabase direct Postgres connection string for migrations. |
| `GEMINI_API_KEY` | Server-only API key for rubric marking. |
| `GEMINI_MODEL` | Gemini model name, for example `gemini-1.5-flash`. |
| `TUTOR_PASSWORD_HASH` | Bcrypt hash for the single tutor password. |
| `SESSION_SECRET` | At least 32 random characters. Used to sign tutor sessions, student access sessions, and protected access-code hashes. |

Generate a tutor password hash locally with:

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash(process.argv[1], 12).then(console.log)" "your-password"
```

When pasting a bcrypt hash into a local `.env` file, escape each `$` as `\$` so Next.js dotenv expansion preserves the hash.

## Database Setup

1. Create a Supabase project.
2. Copy the transaction pooler connection string into `DATABASE_URL`.
3. Copy the direct connection string into `DIRECT_DATABASE_URL`.
4. Run migrations:

```bash
npm run db:migrate
```

For local iteration, generate future migrations from the Drizzle schema with:

```bash
npm run db:generate
```

## Vercel Setup

1. Import this repository into Vercel.
2. Add the environment variables above.
3. Deploy a preview.
4. Run `npm run db:migrate` against the Supabase database before using the preview.
5. Open `/admin/login`, sign in, and import a paper JSON document through `/admin/import`.

## v1 K349 Import Format

Top-level shape:

```json
{
  "schemaVersion": "1.0",
  "paperId": "k349-g3-computing-practice-1",
  "title": "K349 G3 Computing Practice Paper 1",
  "syllabus": "K349 G3 Computing",
  "mode": "practice",
  "status": "published",
  "totalMarks": 30,
  "accessCodes": [{ "code": "G3K349", "label": "G3 Computing" }],
  "questions": []
}
```

Each question includes `id`, `number`, `title`, `marks`, and `parts`, with optional `outcomeId`, `variantGroupId`, `targetAnswerId`, `difficulty`, and `stimulus`.

Each answerable part includes `id`, `label`, `type`, `prompt`, `marks`, and `marking`, with optional `stimulus`, `response`, and `studentFeedbackPolicy`.

Supported part types:

- `single_choice`
- `multiple_choice`
- `short_text`
- `structured_response`
- `code_output_table`
- `error_correction`
- `flowchart_interpretation`
- `code_writing`

Supported stimulus types:

- `text`
- `code`
- `table`
- `expected_output`
- `flowchart`

Supported marking modes:

- `exact`
- `code_output_table`
- `error_correction`
- `rubric_ai`

Re-importing an existing `paperId` creates a new paper version for future attempts. Existing attempts remain tied to the version they started with, so their review data is not rewritten.
