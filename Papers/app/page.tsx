import Link from "next/link";
import { getStudentSession } from "@/lib/auth/session";
import { clearStudentAccessAction, enterStudentAccessAction } from "@/lib/student/actions";
import { getPublishedPapersForStudent } from "@/lib/student/data";

export default async function HomePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const session = getStudentSession();
  const papers = session ? await getPublishedPapersForStudent(session.accessCodeId) : [];
  const error =
    searchParams.error === "access"
      ? "That access code is not active."
      : searchParams.error === "name"
        ? "Enter your name before opening papers."
        : null;

  return (
    <main className="section">
      <header className="page-header">
        <p className="eyebrow">Practice mode</p>
        <h1>G3 Computing Practice Papers</h1>
        <p className="body-copy">
          Enter a valid access code and student name to open the papers available
          for your class.
        </p>
      </header>
      {error ? <p className="notice error">{error}</p> : null}
      {session ? (
        <section className="stack">
          <div className="toolbar">
            <p>
              Signed in as <strong>{session.studentName}</strong>
            </p>
            <form action={clearStudentAccessAction}>
              <button type="submit" className="secondary">
                Change access
              </button>
            </form>
          </div>
          {papers.length > 0 ? (
            <ul className="list">
              {papers.map((paper) => (
                <li className="card stack" key={paper.id}>
                  <div>
                    <h2>{paper.title}</h2>
                    <p className="meta">
                      {paper.syllabus} · {paper.totalMarks} marks
                    </p>
                  </div>
                  <Link className="button" href={`/papers/${paper.id}`}>
                    Open paper
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notice">No published papers are currently attached to this access code.</p>
          )}
        </section>
      ) : (
        <form action={enterStudentAccessAction} className="card stack">
          <label>
            Access code
            <input name="accessCode" autoComplete="off" required />
          </label>
          <label>
            Student name
            <input name="studentName" autoComplete="name" required />
          </label>
          <div className="toolbar">
            <button type="submit">Show papers</button>
            <Link href="/admin/login" className="button secondary">
              Tutor sign in
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
