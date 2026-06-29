import React from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { PromptText } from "@/components/student/PromptText";
import { StimulusRenderer } from "@/components/student/StimulusRenderer";
import type { getAdminAttemptDetail } from "@/lib/admin/data";
import type { MarkingSchema, ResponseSchema, StudentAnswer } from "@/lib/domain";

type AdminAttemptDetail = NonNullable<Awaited<ReturnType<typeof getAdminAttemptDetail>>>;
type AttemptPart = AdminAttemptDetail["questions"][number]["parts"][number];
type PartAnswer = NonNullable<AttemptPart["answer"]>;
type FormAction = string | ((formData: FormData) => void | Promise<void>);

export function AttemptDetailView({
  detail,
  manualOverrideAction,
  overrideOutcome,
  overrideReason,
  remarkOutcome,
  remarkReason,
  resubmitAction
}: {
  detail: AdminAttemptDetail;
  manualOverrideAction: FormAction;
  overrideOutcome?: string;
  overrideReason?: string;
  remarkOutcome?: string;
  remarkReason?: string;
  resubmitAction: FormAction;
}) {
  return (
    <main className="section">
      <AdminNav />
      <header className="page-header">
        <p className="eyebrow">{detail.attempt.syllabus}</p>
        <h1>{detail.attempt.paperTitle}</h1>
        <p className="body-copy">
          {detail.attempt.studentName} · attempt {detail.attempt.attemptNumber} ·{" "}
          <span className="status-pill">{detail.attempt.displayStatus}</span>
        </p>
        <p className="meta">
          Access code: {detail.attempt.accessCodeLabel} · started {formatDate(detail.attempt.startedAt)} ·
          last seen {formatDate(detail.attempt.lastSeenAt)}
          {detail.attempt.submittedAt ? ` · submitted ${formatDate(detail.attempt.submittedAt)}` : ""}
        </p>
      </header>
      <RemarkNotice outcome={remarkOutcome} reason={remarkReason} />
      <OverrideNotice outcome={overrideOutcome} reason={overrideReason} />
      <section className="stack">
        {detail.questions.map((question) => (
          <article className="stack" key={question.id}>
            <div>
              <p className="eyebrow">Question {question.number}</p>
              <h2>{question.title}</h2>
              <p className="meta">{question.marks} marks</p>
            </div>
            <StimulusRenderer stimuli={question.stimulus} />
            {question.parts.map((part) => {
              const leadingStimuli = part.stimulus.filter((stimulus) => stimulus.type === "code");
              const trailingStimuli = part.stimulus.filter((stimulus) => stimulus.type !== "code");

              return (
                <section className="card stack" key={part.id}>
                  <div className="toolbar">
                    <div className="stack">
                      <h3>
                        {part.label} <span className="meta">[{part.marks}]</span>
                      </h3>
                    </div>
                    {part.canResubmitAiMark ? (
                      <form action={resubmitAction}>
                        <input type="hidden" name="attemptId" value={detail.attempt.id} />
                        <input type="hidden" name="questionPartId" value={part.id} />
                        <button type="submit" className="secondary">
                          Resubmit AI marking
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <div className="stack">
                    <StimulusRenderer stimuli={leadingStimuli} />
                    <PromptText text={part.prompt} />
                  </div>
                  <StimulusRenderer stimuli={trailingStimuli} />
                  <div className="grid two">
                    <ReviewSection title="Student answer">
                      <StudentAnswerReview
                        answer={part.answer?.answer ?? null}
                        responseSchema={part.responseSchema}
                      />
                    </ReviewSection>
                    <ReviewSection title="Marking schema">
                      <MarkingSchemaReview schema={part.markingSchema} />
                    </ReviewSection>
                  </div>
                  <div className="grid two">
                    <MarkSummary answer={part.answer} fallbackMaxScore={part.marks} />
                    <div className="stack">
                      <p className="meta">Student feedback</p>
                      <ReviewText text={part.answer?.studentFeedback ?? "No feedback stored yet."} />
                    </div>
                  </div>
                  <div className="grid two">
                    <ReviewSection title="Tutor rationale">
                      <RationaleReview text={part.answer?.tutorRationale ?? null} />
                    </ReviewSection>
                    <ReviewSection title="Missing rubric points">
                      <MissingRubricReview points={part.answer?.missingRubricPoints ?? []} />
                    </ReviewSection>
                  </div>
                  <ReviewSection title="Marking audit">
                    <AuditReview
                      details={part.answer?.exactMarkingDetails ?? null}
                      schema={part.markingSchema}
                    />
                  </ReviewSection>
                  {detail.attempt.status === "submitted" && part.answer ? (
                    <ManualOverrideForm
                      action={manualOverrideAction}
                      answer={part.answer}
                      attemptId={detail.attempt.id}
                      part={part}
                    />
                  ) : null}
                </section>
              );
            })}
          </article>
        ))}
      </section>
      <Link href="/admin/attempts" className="button secondary">
        Back to attempts
      </Link>
    </main>
  );
}

function ReviewSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="review-panel stack">
      <p className="meta">{title}</p>
      {children}
    </section>
  );
}

function MarkSummary({
  answer,
  fallbackMaxScore
}: {
  answer: PartAnswer | null;
  fallbackMaxScore: number;
}) {
  return (
    <div className="stack">
      <p className="meta">Score</p>
      <p className="row">
        <strong>
          {answer?.score ?? 0} / {answer?.maxScore ?? fallbackMaxScore}
        </strong>
        <span className="status-pill">{answer?.markingStatus ?? "pending"}</span>
        <span className="status-pill">Source: {formatMarkingSource(answer?.markingSource)}</span>
      </p>
      {answer?.markedAt ? <p className="meta">Marked {formatDate(answer.markedAt)}</p> : null}
    </div>
  );
}

function StudentAnswerReview({
  answer,
  responseSchema
}: {
  answer: StudentAnswer | null;
  responseSchema: ResponseSchema | null;
}) {
  if (answer === null) {
    return <p className="muted">No answer saved yet.</p>;
  }

  if (typeof answer === "string") {
    return <ReviewText text={answer || "No answer provided."} />;
  }

  if (!isRecord(answer)) {
    return <ReviewText text={String(answer)} />;
  }

  if (Array.isArray(answer.values)) {
    return (
      <ul className="review-list">
        {answer.values.length > 0 ? (
          answer.values.map((value) => <li key={value}>{optionLabel(responseSchema, value)}</li>)
        ) : (
          <li>No options selected.</li>
        )}
      </ul>
    );
  }

  if (isRecord(answer.rows)) {
    const answerRows = answer.rows;
    const rows =
      responseSchema?.kind === "code_output_table"
        ? responseSchema.rows.map((row) => ({
            id: row.id,
            label: row.label,
            prompt: row.prompt,
            value: formatScalar(answerRows[row.id])
          }))
        : Object.entries(answerRows).map(([id, value]) => ({
            id,
            label: id,
            prompt: undefined,
            value: formatScalar(value)
          }));

    return (
      <table className="review-table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.label}</strong>
                {row.prompt ? <p className="meta">{row.prompt}</p> : null}
              </td>
              <td>
                <ReviewText text={row.value || "No answer provided."} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if ("lineNumber" in answer || "correctedLine" in answer) {
    return (
      <dl className="review-details">
        <div>
          <dt>Line number</dt>
          <dd>{formatScalar(answer.lineNumber) || "Not provided"}</dd>
        </div>
        <div>
          <dt>Corrected line</dt>
          <dd>
            <CodeValue value={formatScalar(answer.correctedLine) || "Not provided"} />
          </dd>
        </div>
      </dl>
    );
  }

  if ("value" in answer) {
    const value = formatScalar(answer.value);
    return <ReviewText text={optionLabel(responseSchema, value) || "No answer provided."} />;
  }

  return <ReadableValue value={answer} />;
}

function MarkingSchemaReview({ schema }: { schema: MarkingSchema }) {
  switch (schema.mode) {
    case "exact":
      return (
        <dl className="review-details">
          <div>
            <dt>Accepted answers</dt>
            <dd>
              <InlineList values={schema.acceptedAnswers.map(formatScalar)} />
            </dd>
          </div>
          <div>
            <dt>Case sensitive</dt>
            <dd>{schema.caseSensitive ? "Yes" : "No"}</dd>
          </div>
        </dl>
      );
    case "code_output_table":
      return (
        <div className="stack">
          <table className="review-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Expected output</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {schema.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.label ?? row.id}</td>
                  <td>
                    <CodeValue value={formatScalar(row.expectedOutput)} />
                  </td>
                  <td>{row.marks ?? 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="meta">Case sensitive: {schema.caseSensitive ? "yes" : "no"}</p>
        </div>
      );
    case "error_correction":
      return (
        <dl className="review-details">
          <div>
            <dt>Expected line number</dt>
            <dd>{formatScalar(schema.expectedLineNumber)}</dd>
          </div>
          <div>
            <dt>Accepted corrected lines</dt>
            <dd>
              <ul className="review-list">
                {schema.acceptedCorrectedLines.map((line) => (
                  <li key={line}>
                    <CodeValue value={line} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Marks</dt>
            <dd>
              Line {schema.lineNumberMarks ?? 1}; correction{" "}
              {schema.correctionMarks ?? "remaining"}
            </dd>
          </div>
          <div>
            <dt>Case sensitive</dt>
            <dd>{schema.caseSensitive ? "Yes" : "No"}</dd>
          </div>
        </dl>
      );
    case "rubric_ai":
      return (
        <div className="stack">
          <div>
            <p className="meta">Model answer</p>
            <ReviewText text={schema.modelAnswer} />
          </div>
          <div>
            <p className="meta">Rubric points</p>
            <ul className="review-list">
              {schema.rubricPoints.map((point, index) => (
                <li key={point.id ?? index}>
                  {point.text}
                  {point.marks ? <span className="meta"> ({point.marks} marks)</span> : null}
                </li>
              ))}
            </ul>
          </div>
          {schema.maxScore ? <p className="meta">Maximum score: {schema.maxScore}</p> : null}
        </div>
      );
    default:
      return exhaustive(schema);
  }
}

function MissingRubricReview({ points }: { points: string[] }) {
  if (points.length === 0) {
    return <p className="muted">No missing rubric points stored.</p>;
  }

  return (
    <ul className="review-list">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

function RationaleReview({ text }: { text: string | null }) {
  if (!text) {
    return <p className="muted">No tutor rationale stored.</p>;
  }

  return <ReviewText text={text} />;
}

function AuditReview({ details, schema }: { details: unknown; schema: MarkingSchema }) {
  if (!details) {
    return <p className="muted">No audit details stored.</p>;
  }

  if (!isRecord(details)) {
    return <ReadableValue value={details} />;
  }

  if (schema.mode === "exact") {
    return (
      <dl className="review-details">
        <div>
          <dt>Submitted</dt>
          <dd>{formatScalar(details.submitted)}</dd>
        </div>
        <div>
          <dt>Accepted answers</dt>
          <dd>
            <InlineList values={toArray(details.acceptedAnswers).map(formatScalar)} />
          </dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>{details.matched ? "Matched" : "Did not match"}</dd>
        </div>
        <div>
          <dt>Case sensitive</dt>
          <dd>{details.caseSensitive ? "Yes" : "No"}</dd>
        </div>
      </dl>
    );
  }

  if (schema.mode === "code_output_table" && Array.isArray(details.rows)) {
    return (
      <table className="review-table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Submitted</th>
            <th>Expected</th>
            <th>Score</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {details.rows.map((row, index) => {
            const record = isRecord(row) ? row : {};

            return (
              <tr key={formatScalar(record.id ?? index)}>
                <td>{formatScalar(record.label ?? record.id ?? index + 1)}</td>
                <td>
                  <CodeValue value={formatScalar(record.submitted)} />
                </td>
                <td>
                  <CodeValue value={formatScalar(record.expectedOutput)} />
                </td>
                <td>
                  {formatScalar(record.awarded ?? 0)} / {formatScalar(record.marks ?? 0)}
                </td>
                <td>{record.matched ? "Matched" : "Did not match"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (schema.mode === "error_correction") {
    return (
      <dl className="review-details">
        <div>
          <dt>Submitted line number</dt>
          <dd>{formatScalar(details.submittedLineNumber)}</dd>
        </div>
        <div>
          <dt>Expected line number</dt>
          <dd>{formatScalar(details.expectedLineNumber)}</dd>
        </div>
        <div>
          <dt>Submitted correction</dt>
          <dd>
            <CodeValue value={formatScalar(details.submittedCorrectedLine)} />
          </dd>
        </div>
        <div>
          <dt>Accepted corrected lines</dt>
          <dd>
            <ul className="review-list">
              {toArray(details.acceptedCorrectedLines).map((line) => (
                <li key={formatScalar(line)}>
                  <CodeValue value={formatScalar(line)} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Line result</dt>
          <dd>{details.lineMatched ? "Matched" : "Did not match"}</dd>
        </div>
        <div>
          <dt>Correction result</dt>
          <dd>{details.correctionMatched ? "Matched" : "Did not match"}</dd>
        </div>
      </dl>
    );
  }

  return <ReadableValue value={details} />;
}

function ManualOverrideForm({
  action,
  answer,
  attemptId,
  part
}: {
  action: FormAction;
  answer: PartAnswer;
  attemptId: string;
  part: AttemptPart;
}) {
  const maxScore = answer.maxScore ?? part.marks;

  return (
    <form action={action} className="manual-override stack">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="questionPartId" value={part.id} />
      <p className="meta">Manual override</p>
      <div className="grid two">
        <label>
          <span>Score</span>
          <input
            aria-label={`Score for ${part.label}`}
            defaultValue={answer.score ?? 0}
            max={maxScore}
            min={0}
            name="score"
            required
            step={1}
            type="number"
          />
        </label>
        <div className="stack">
          <p className="meta">Allowed range</p>
          <p>
            0 to {maxScore} mark{maxScore === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <label>
        <span>Student feedback</span>
        <textarea
          aria-label={`Student feedback for ${part.label}`}
          defaultValue={answer.studentFeedback ?? ""}
          name="studentFeedback"
          required
        />
      </label>
      <label>
        <span>Tutor rationale</span>
        <textarea
          aria-label={`Tutor rationale for ${part.label}`}
          defaultValue={answer.tutorRationale ?? ""}
          name="tutorRationale"
        />
      </label>
      <button type="submit" className="secondary">
        Save manual mark
      </button>
    </form>
  );
}

function RemarkNotice({ outcome, reason }: { outcome?: string; reason?: string }) {
  if (outcome === "success") {
    return (
      <div className="notice success">
        <p>AI marking was resubmitted and the latest result is shown below.</p>
      </div>
    );
  }

  if (outcome === "failed") {
    return (
      <div className="notice error">
        <p>{failureMessage(reason)}</p>
      </div>
    );
  }

  return null;
}

function OverrideNotice({ outcome, reason }: { outcome?: string; reason?: string }) {
  if (outcome === "success") {
    return (
      <div className="notice success">
        <p>Manual mark was saved and the latest result is shown below.</p>
      </div>
    );
  }

  if (outcome === "failed") {
    return (
      <div className="notice error">
        <p>{overrideFailureMessage(reason)}</p>
      </div>
    );
  }

  return null;
}

function failureMessage(reason?: string) {
  if (reason === "marking_failed") {
    return "Gemini could not complete marking; the part now shows a failed marking status.";
  }

  return "AI marking could not be resubmitted for this part.";
}

function overrideFailureMessage(reason?: string) {
  if (reason === "attempt_not_submitted") {
    return "Manual marks can only be saved for submitted attempts.";
  }

  if (reason === "invalid_score") {
    return "Manual mark was rejected because the score is outside the allowed range.";
  }

  return "Manual mark could not be saved for this answer.";
}

function ReviewText({ text }: { text: string }) {
  return <p className="review-text">{text}</p>;
}

function ReadableValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="muted">None</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="muted">None</span>;
    }

    return (
      <ul className="review-list">
        {value.map((item, index) => (
          <li key={index}>
            <ReadableValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    return (
      <dl className="review-details">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key}>
            <dt>{humanizeKey(key)}</dt>
            <dd>
              <ReadableValue value={entry} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="review-text">{formatScalar(value)}</span>;
}

function InlineList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="muted">None</span>;
  }

  return <span className="review-text">{values.join(", ")}</span>;
}

function CodeValue({ value }: { value: string }) {
  return (
    <pre className="review-code">
      <code>{value}</code>
    </pre>
  );
}

function optionLabel(responseSchema: ResponseSchema | null, value: string) {
  if (
    responseSchema?.kind !== "single_choice" &&
    responseSchema?.kind !== "multiple_choice"
  ) {
    return value;
  }

  return responseSchema.options.find((option) => option.value === value)?.label ?? value;
}

function formatScalar(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatMarkingSource(source: PartAnswer["markingSource"] | undefined) {
  return source === "manual" ? "Manual" : "Auto";
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exhaustive(value: never): never {
  throw new Error(`Unsupported marking schema: ${JSON.stringify(value)}`);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
