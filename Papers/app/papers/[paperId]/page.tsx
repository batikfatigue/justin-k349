import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudentSession } from "@/lib/auth/session";
import { startAttemptAction } from "@/lib/student/actions";
import { getStudentPaperIntro } from "@/lib/student/data";

export default async function PaperIntroPage({ params }: { params: { paperId: string } }) {
  const session = requireStudentSession();
  const paper = await getStudentPaperIntro(params.paperId, session);

  if (!paper) {
    notFound();
  }

  return (
    <main className="section">
      <header className="page-header">
        <p className="eyebrow">{paper.syllabus}</p>
        <h1>{paper.title}</h1>
        <p className="body-copy">
          {paper.questionCount} questions · {paper.totalMarks} marks · attempt{" "}
          {paper.nextAttemptNumber} for {session.studentName}
        </p>
      </header>
      <div className="toolbar">
        <form action={startAttemptAction}>
          <input type="hidden" name="paperId" value={paper.id} />
          <button type="submit">
            {paper.nextAttemptNumber > 1 ? "Start reattempt" : "Start paper"}
          </button>
        </form>
        <Link href="/" className="button secondary">
          Back
        </Link>
      </div>
    </main>
  );
}
