import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { StimulusRenderer } from "@/components/student/StimulusRenderer";
import { requireTutorSession } from "@/lib/auth/session";
import { getAdminAttemptDetail } from "@/lib/admin/data";

export default async function AdminAttemptDetailPage({ params }: { params: { attemptId: string } }) {
  requireTutorSession();
  const detail = await getAdminAttemptDetail(params.attemptId);

  if (!detail) {
    notFound();
  }

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
      <section className="stack">
        {detail.questions.map((question) => (
          <article className="stack" key={question.id}>
            <div>
              <p className="eyebrow">Question {question.number}</p>
              <h2>{question.title}</h2>
              <p className="meta">{question.marks} marks</p>
            </div>
            <StimulusRenderer stimuli={question.stimulus} />
            {question.parts.map((part) => (
              <section className="card stack" key={part.id}>
                <div>
                  <h3>
                    {part.label} <span className="meta">[{part.marks}]</span>
                  </h3>
                  <p className="body-copy">{part.prompt}</p>
                </div>
                <StimulusRenderer stimuli={part.stimulus} />
                <div className="grid two">
                  <JsonBlock title="Student answer" value={part.answer?.answer ?? {}} />
                  <JsonBlock title="Marking schema" value={part.markingSchema} />
                </div>
                <div className="grid two">
                  <div>
                    <p className="meta">Score</p>
                    <p>
                      <strong>
                        {part.answer?.score ?? 0} / {part.answer?.maxScore ?? part.marks}
                      </strong>{" "}
                      <span className="status-pill">{part.answer?.markingStatus ?? "pending"}</span>
                    </p>
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
            ))}
          </article>
        ))}
      </section>
      <Link href="/admin/attempts" className="button secondary">
        Back to attempts
      </Link>
    </main>
  );
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
