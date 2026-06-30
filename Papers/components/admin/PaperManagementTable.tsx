import React from "react";
import Link from "next/link";
import type { AdminPaperSummary } from "@/lib/admin/papers";

type FormAction = string | ((formData: FormData) => void | Promise<void>);

export function PaperManagementTable({
  deleteAction,
  papers
}: {
  deleteAction: FormAction;
  papers: AdminPaperSummary[];
}) {
  if (papers.length === 0) {
    return (
      <section className="card stack">
        <h2>No imported papers</h2>
        <p className="body-copy">Import a paper JSON document to make it available for practice attempts.</p>
        <Link href="/admin/import" className="button">
          Import paper
        </Link>
      </section>
    );
  }

  return (
    <section className="card table-card" aria-label="Imported papers">
      <table>
        <thead>
          <tr>
            <th>Paper</th>
            <th>Syllabus</th>
            <th>Status</th>
            <th>Marks</th>
            <th>Version</th>
            <th>Latest import/update</th>
            <th>Attempts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper.id}>
              <td>
                <strong>{paper.title}</strong>
                <p className="meta">{paper.id}</p>
              </td>
              <td>{paper.syllabus}</td>
              <td>
                <span className="status-pill">{paper.status}</span>
              </td>
              <td>{paper.totalMarks}</td>
              <td>{paper.currentVersionNumber ?? "None"}</td>
              <td>{formatDate(paper.lastImportedOrUpdatedAt)}</td>
              <td>{paper.attemptCount}</td>
              <td>
                <div className="paper-actions">
                  <Link href={`/admin/papers/${paper.id}`} className="button secondary">
                    Update
                  </Link>
                  <DeletePaperControl paper={paper} deleteAction={deleteAction} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DeletePaperControl({
  deleteAction,
  paper
}: {
  deleteAction: FormAction;
  paper: AdminPaperSummary;
}) {
  if (paper.attemptCount === 0) {
    return (
      <form action={deleteAction}>
        <input type="hidden" name="paperId" value={paper.id} />
        <input type="hidden" name="confirmedAttemptCount" value="0" />
        <button type="submit" className="secondary">
          Delete
        </button>
      </form>
    );
  }

  return (
    <details className="delete-confirmation">
      <summary>Delete</summary>
      <div className="delete-confirmation-panel">
        <p className="meta">
          This paper has {paper.attemptCount} {paper.attemptCount === 1 ? "attempt" : "attempts"}. Deleting it
          will permanently remove attempts, answers, marks, and feedback.
        </p>
        <form action={deleteAction}>
          <input type="hidden" name="paperId" value={paper.id} />
          <input type="hidden" name="confirmedAttemptCount" value={paper.attemptCount} />
          <button type="submit" className="secondary danger">
            Confirm delete
          </button>
        </form>
      </div>
    </details>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
