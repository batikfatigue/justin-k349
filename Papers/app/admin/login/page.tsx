import Link from "next/link";
import { loginTutorAction } from "./actions";

export default function TutorLoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === "invalid";
  const hasConfigError = searchParams.error === "misconfigured";

  return (
    <main className="section">
      <header className="page-header">
        <p className="eyebrow">Tutor area</p>
        <h1>Sign in</h1>
        <p className="body-copy">Use the configured tutor password to review imports and attempts.</p>
      </header>
      {hasError ? <p className="notice error">The password did not match.</p> : null}
      {hasConfigError ? (
        <p className="notice error">Tutor sign-in is not configured. Set TUTOR_PASSWORD_HASH to a bcrypt hash.</p>
      ) : null}
      <form action={loginTutorAction} className="card stack">
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <div className="toolbar">
          <button type="submit">Sign in</button>
          <Link href="/" className="button secondary">
            Student home
          </Link>
        </div>
      </form>
    </main>
  );
}
