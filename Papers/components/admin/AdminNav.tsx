import React from "react";
import Link from "next/link";
import { logoutTutorAction } from "@/app/admin/login/actions";

export function AdminNav() {
  return (
    <nav className="toolbar" aria-label="Admin navigation">
      <div className="row">
        <Link href="/admin/papers">Papers</Link>
        <Link href="/admin/import">Import</Link>
        <Link href="/admin/attempts">Attempts</Link>
      </div>
      <form action={logoutTutorAction}>
        <button className="secondary" type="submit">
          Sign out
        </button>
      </form>
    </nav>
  );
}
