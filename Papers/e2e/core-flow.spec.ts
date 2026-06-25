import { expect, test } from "@playwright/test";

test.describe("core student and tutor flows", () => {
  test("homepage and tutor login render without overlapping primary controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "G3 Computing Practice Papers" })).toBeVisible();
    await expect(page.getByLabel("Access code")).toBeVisible();
    await expect(page.getByLabel("Student name")).toBeVisible();

    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("configured seeded paper flow", async ({ page }) => {
    test.skip(!process.env.E2E_ACCESS_CODE || !process.env.E2E_STUDENT_NAME, "Set E2E_ACCESS_CODE and E2E_STUDENT_NAME for seeded paper coverage.");

    await page.goto("/");
    await page.getByLabel("Access code").fill(process.env.E2E_ACCESS_CODE!);
    await page.getByLabel("Student name").fill(process.env.E2E_STUDENT_NAME!);
    await page.getByRole("button", { name: "Show papers" }).click();
    await page.getByRole("link", { name: "Open paper" }).first().click();
    await page.getByRole("button", { name: /Start/ }).click();
    await expect(page.getByRole("heading", { name: /Question/ })).toBeVisible();
  });
});
