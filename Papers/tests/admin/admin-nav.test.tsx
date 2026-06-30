// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminNav } from "@/components/admin/AdminNav";

vi.mock("@/app/admin/login/actions", () => ({
  logoutTutorAction: "/admin/login"
}));

describe("AdminNav", () => {
  it("links to paper management alongside import and attempts", () => {
    render(<AdminNav />);

    expect(screen.getByRole("link", { name: "Papers" })).toHaveAttribute("href", "/admin/papers");
    expect(screen.getByRole("link", { name: "Import" })).toHaveAttribute("href", "/admin/import");
    expect(screen.getByRole("link", { name: "Attempts" })).toHaveAttribute("href", "/admin/attempts");
  });
});
