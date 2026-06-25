import { AdminNav } from "@/components/admin/AdminNav";
import { ImportForm } from "@/components/admin/ImportForm";
import { requireTutorSession } from "@/lib/auth/session";

export default function AdminImportPage() {
  requireTutorSession();

  return (
    <main className="section">
      <AdminNav />
      <header className="page-header">
        <p className="eyebrow">Paper import</p>
        <h1>Validate and import JSON</h1>
        <p className="body-copy">
          Paste a v1 K349 paper JSON document. Validation reports the paper title,
          syllabus, access-code count, question count, part count, and total marks before import.
        </p>
      </header>
      <ImportForm />
    </main>
  );
}
