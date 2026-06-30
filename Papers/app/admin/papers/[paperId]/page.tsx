import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { PaperUpdateForm } from "@/components/admin/PaperUpdateForm";
import { requireTutorSession } from "@/lib/auth/session";
import { getCurrentPaperSourceJson } from "@/lib/admin/papers";
import { updateSelectedPaperAction } from "../actions";

type AdminPaperEditPageProps = {
  params: {
    paperId: string;
  };
};

export default async function AdminPaperEditPage({ params }: AdminPaperEditPageProps) {
  requireTutorSession();
  const paper = await getCurrentPaperSourceJson(params.paperId);

  if (!paper) {
    return (
      <main className="section">
        <AdminNav />
        <header className="page-header">
          <p className="eyebrow">Paper management</p>
          <h1>Paper not found</h1>
          <p className="body-copy">No imported paper exists for {params.paperId}.</p>
        </header>
        <Link href="/admin/papers" className="button secondary">
          Back to papers
        </Link>
      </main>
    );
  }

  const updateAction = updateSelectedPaperAction.bind(null, params.paperId);

  return (
    <main className="section">
      <AdminNav />
      <header className="page-header">
        <p className="eyebrow">Update paper JSON</p>
        <h1>{paper.title}</h1>
        <p className="meta">
          {paper.id} · current version {paper.versionNumber} · imported {formatDate(paper.importedAt)}
        </p>
      </header>
      <PaperUpdateForm action={updateAction} initialJsonText={JSON.stringify(paper.sourceJson, null, 2)} />
      <Link href="/admin/papers" className="button secondary">
        Back to papers
      </Link>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
