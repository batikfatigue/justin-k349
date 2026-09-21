import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireTutorSession } from "@/lib/auth/session";
import { listAdminAttempts } from "@/lib/admin/data";

type AdminAttemptsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminAttemptsPage({ searchParams = {} }: AdminAttemptsPageProps) {
  requireTutorSession();
  const requestedPage = parsePage(searchParams.page);
  const { attempts, page, pageSize, total, totalPages } = await listAdminAttempts({
    page: requestedPage
  });
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

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
        <nav className="row" aria-label="Attempts pagination">
          <p className="meta">
            Showing {firstRow}–{lastRow} of {total} attempts (page {page} of {totalPages})
          </p>
          {page > 1 ? (
            <Link className="button secondary" href={pageHref(page - 1)}>
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className="button secondary" href={pageHref(page + 1)}>
              Next
            </Link>
          ) : null}
        </nav>
      </div>
    </main>
  );
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number) {
  return page === 1 ? "/admin/attempts" : `/admin/attempts?page=${page}`;
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
