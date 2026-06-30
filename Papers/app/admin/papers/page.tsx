import { AdminNav } from "@/components/admin/AdminNav";
import { PaperManagementTable } from "@/components/admin/PaperManagementTable";
import { requireTutorSession } from "@/lib/auth/session";
import { listAdminPapers } from "@/lib/admin/papers";
import { deletePaperAction } from "./actions";

type AdminPapersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminPapersPage({ searchParams = {} }: AdminPapersPageProps) {
  requireTutorSession();
  const papers = await listAdminPapers();

  return (
    <main className="section">
      <AdminNav />
      <header className="page-header">
        <p className="eyebrow">Paper management</p>
        <h1>Papers</h1>
        <p className="body-copy">
          View imported papers, update a selected paper from JSON, and delete unused papers.
        </p>
      </header>
      <PaperNotice searchParams={searchParams} />
      <PaperManagementTable papers={papers} deleteAction={deletePaperAction} />
    </main>
  );
}

function PaperNotice({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const updated = getSearchValue(searchParams.updated);
  const deleted = getSearchValue(searchParams.deleted);
  const deleteStatus = getSearchValue(searchParams.delete);
  const blockedPaperId = getSearchValue(searchParams.paperId);
  const reason = getSearchValue(searchParams.reason);
  const attempts = getSearchValue(searchParams.attempts);
  const confirmed = getSearchValue(searchParams.confirmed);

  if (updated) {
    return <div className="notice success">Updated {updated}.</div>;
  }

  if (deleted) {
    return <div className="notice success">Deleted {deleted}.</div>;
  }

  if (deleteStatus === "blocked") {
    if (reason === "stale_attempt_count" && blockedPaperId && attempts && confirmed) {
      return (
        <div className="notice error">
          Could not delete {blockedPaperId} because the attempt count changed from {confirmed} to {attempts}.
          Refresh and confirm the current deletion impact.
        </div>
      );
    }

    return (
      <div className="notice error">
        {blockedPaperId
          ? `Could not delete ${blockedPaperId}.`
          : "Could not delete the selected paper."}
      </div>
    );
  }

  return null;
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
