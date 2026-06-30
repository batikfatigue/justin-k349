// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaperManagementTable } from "@/components/admin/PaperManagementTable";
import {
  getCurrentPaperSourceJson,
  listAdminPapers,
  type AdminPaperSummary
} from "@/lib/admin/papers";
import { k349Paper } from "@/tests/fixtures/k349-paper";

vi.mock("server-only", () => ({}));

const importedAt = new Date("2026-06-26T04:00:00.000Z");

describe("admin paper management helpers", () => {
  it("returns imported paper metadata with attempt counts", async () => {
    const db = createListDb([
      {
        id: "paper-1",
        title: "Practice Paper",
        syllabus: "K349",
        status: "published",
        totalMarks: 32,
        updatedAt: new Date("2026-06-25T04:00:00.000Z"),
        currentVersionNumber: 3,
        currentVersionImportedAt: importedAt,
        attemptCount: "2"
      }
    ]);

    const papers = await listAdminPapers(db as any);

    expect(papers).toEqual([
      {
        id: "paper-1",
        title: "Practice Paper",
        syllabus: "K349",
        status: "published",
        totalMarks: 32,
        currentVersionNumber: 3,
        lastImportedOrUpdatedAt: importedAt,
        attemptCount: 2
      }
    ]);
  });

  it("renders an empty state when no papers exist", () => {
    render(<PaperManagementTable papers={[]} deleteAction={"/delete" as any} />);

    expect(screen.getByRole("heading", { name: "No imported papers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import paper" })).toHaveAttribute("href", "/admin/import");
  });

  it("renders metadata and shows delete confirmation for papers with attempts", () => {
    render(
      <PaperManagementTable
        papers={[
          makePaperSummary({
            attemptCount: 2
          })
        ]}
        deleteAction={"/delete" as any}
      />
    );

    expect(screen.getByText("Practice Paper")).toBeInTheDocument();
    expect(screen.getByText("paper-1")).toBeInTheDocument();
    expect(screen.getByText("K349")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Update" })).toHaveAttribute("href", "/admin/papers/paper-1");
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText(/This paper has 2 attempts/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
  });

  it("loads the current source JSON for a selected paper", async () => {
    const db = createSourceDb([
      {
        id: "paper-1",
        title: "Practice Paper",
        versionNumber: 2,
        importedAt,
        sourceJson: k349Paper
      }
    ]);

    await expect(getCurrentPaperSourceJson("paper-1", db as any)).resolves.toEqual({
      id: "paper-1",
      title: "Practice Paper",
      versionNumber: 2,
      importedAt,
      sourceJson: k349Paper
    });
  });

  it("returns null when the selected paper does not exist", async () => {
    const db = createSourceDb([]);

    await expect(getCurrentPaperSourceJson("missing-paper", db as any)).resolves.toBeNull();
  });
});

function makePaperSummary(overrides: Partial<AdminPaperSummary> = {}): AdminPaperSummary {
  return {
    id: "paper-1",
    title: "Practice Paper",
    syllabus: "K349",
    status: "published",
    totalMarks: 32,
    currentVersionNumber: 1,
    lastImportedOrUpdatedAt: importedAt,
    attemptCount: 0,
    ...overrides
  };
}

function createListDb(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    leftJoin: vi.fn(() => builder),
    groupBy: vi.fn(() => builder),
    orderBy: vi.fn(async () => rows)
  };

  return {
    select: vi.fn(() => builder)
  };
}

function createSourceDb(rows: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(async () => rows)
  };

  return {
    select: vi.fn(() => builder)
  };
}
