import Link from "next/link";
import { requireStudentSession } from "@/lib/auth/session";
import { getStudentResults } from "@/lib/student/data";

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const session = requireStudentSession();
  const results = await getStudentResults(params.attemptId, session);

  return (
    <main className="section">
      <header className="page-header">
        <p className="eyebrow">Submitted</p>
        <h1>{results.paper?.title}</h1>
        <p className="body-copy">
          Score: {results.totalScore} / {results.paper?.totalMarks}
          {results.pendingCount > 0 ? ` · ${results.pendingCount} part(s) pending review` : ""}
        </p>
      </header>
      <section className="stack">
        {results.parts.map((part) => (
          <article className="card stack" key={part.partId}>
            <div>
              <p className="meta">
                Question {part.questionNumber} · {part.partLabel}
              </p>
              <h3>{part.questionTitle}</h3>
            </div>
            <p className="body-copy">{part.partPrompt}</p>
            <p>
              <strong>
                {part.score ?? 0} / {part.maxScore ?? part.partMarks}
              </strong>{" "}
              <span className="status-pill">{part.markingStatus ?? "pending"}</span>
            </p>
            <p className="body-copy">
              {part.studentFeedback ?? "This answer has been saved and is pending marking."}
            </p>
          </article>
        ))}
      </section>
      <Link className="button secondary" href="/">
        Back to papers
      </Link>
    </main>
  );
}
