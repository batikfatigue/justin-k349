import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G3 Computing Practice Papers",
  description: "Code-gated practice papers with tutor review and AI-assisted marking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
