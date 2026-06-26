import React from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { PromptText } from "@/components/student/PromptText";
import { StimulusRenderer } from "@/components/student/StimulusRenderer";
import type { getAdminAttemptDetail } from "@/lib/admin/data";

type AdminAttemptDetail = NonNullable<Awaited<ReturnType<typeof getAdminAttemptDetail>>>;
type ResubmitAction = (formData: FormData) => void | Promise<void>;

export function AttemptDetailView({
  detail,
  remarkOutcome,
  remarkReason,
  resubmitAction
}: {
  detail: AdminAttemptDetail;
  remarkOutcome?: string;
  remarkReason?: string;
  resubmitAction: ResubmitAction;
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
                    <JsonBlock title="Student answer" value={part.answer?.answer ?? {}} />
                    <JsonBlock title="Marking schema" value={part.markingSchema} />
                  </div>
                  <div className="grid two">
                    <div className="stack">
                      <p className="meta">Score</p>
                      <p>
                        <strong>
                          {part.answer?.score ?? 0} / {part.answer?.maxScore ?? part.marks}
                        </strong>{" "}
                        <span className="status-pill">{part.answer?.markingStatus ?? "pending"}</span>
                      </p>
                      {part.answer?.markedAt ? (
                        <p className="meta">Marked {formatDate(part.answer.markedAt)}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="meta">Student feedback</p>
                      <p>{part.answer?.studentFeedback ?? "No feedback stored yet."}</p>
                    </div>
                  </div>
                  <div className="grid two">
                    <JsonBlock title="Tutor rationale" value={part.answer?.tutorRationale ?? ""} />
                    <JsonBlock title="Missing rubric points" value={part.answer?.missingRubricPoints ?? []} />
                  </div>
                  <JsonBlock title="Exact marking audit" value={part.answer?.exactMarkingDetails ?? null} />
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

function failureMessage(reason?: string) {
  if (reason === "marking_failed") {
    return "Gemini could not complete marking; the part now shows a failed marking status.";
  }

  return "AI marking could not be resubmitted for this part.";
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="stack">
      <p className="meta">{title}</p>
      <pre className="code-block">
        <code>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</code>
      </pre>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
