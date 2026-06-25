import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireTutorSession } from "@/lib/auth/session";
import { listAdminAttempts } from "@/lib/admin/data";

export default async function AdminAttemptsPage() {
  requireTutorSession();
  const attempts = await listAdminAttempts();

  return (
    <main className="section">
      <AdminNav />
      <header className="page-header">
        <p className="eyebrow">Tutor review</p>
        <h1>Attempts</h1>
        <p className="body-copy">
          Review submitted, in-progress, and abandoned attempts with timing and reattempt numbers.
        </p>
      </header>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Paper</th>
              <th>Student</th>
              <th>Attempt</th>
              <th>Status</th>
              <th>Started</th>
              <th>Submitted</th>
              <th>Last seen</th>
              <th>Elapsed</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td>
                  <Link href={`/admin/attempts/${attempt.id}`}>{attempt.paperTitle}</Link>
                  <p className="meta">{attempt.accessCodeLabel}</p>
                </td>
                <td>{attempt.studentName}</td>
                <td>{attempt.attemptNumber}</td>
                <td>
                  <span className="status-pill">{attempt.displayStatus}</span>
                </td>
                <td>{formatDate(attempt.startedAt)}</td>
                <td>{attempt.submittedAt ? formatDate(attempt.submittedAt) : ""}</td>
                <td>{formatDate(attempt.lastSeenAt)}</td>
                <td>{formatElapsed(attempt.elapsedSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
