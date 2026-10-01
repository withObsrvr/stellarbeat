import { test, expect } from "@playwright/test";

/**
 * Every figure in the verdict block must be traceable to an explanation of
 * what it means. These check that each info button opens the right explainer
 * and that the explainer leads with the reader's question rather than the
 * FBAS term -- the failure mode being guarded against is copy drifting back
 * to describing the analysis instead of the number.
 */
test.describe("verdict block explainers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByText("Halts if").first().waitFor({ timeout: 45_000 });
  });

  const cases = [
    { name: "headline", button: /is determined/i, heading: "The verdict" },
    { name: "halts if", button: /What halts if means/i, heading: "Halts if" },
    {
      name: "core forks if",
      button: /What core forks if means/i,
      heading: "Core forks if, and Nodes cut off by",
    },
    {
      name: "nodes cut off by",
      button: /What nodes cut off by means/i,
      heading: "Core forks if, and Nodes cut off by",
    },
    { name: "top tier", button: /What the top tier means/i, heading: "Top tier" },
  ];

  for (const c of cases) {
    test(`${c.name} explainer opens`, async ({ page }) => {
      await page.getByRole("button", { name: c.button }).first().click();
      await expect(
        page.getByRole("heading", { name: c.heading, exact: true }).first(),
      ).toBeVisible({ timeout: 10_000 });
      // correct attribution, not the stale one
      await expect(page.getByText("python-fbas").first()).toBeVisible();
    });
  }

  test("explainers no longer describe a grouping control the reader cannot see", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /What halts if means/i }).first().click();
    const dialog = page.locator("body");
    await expect(dialog).toContainText("offline at the same time");
    await expect(dialog).not.toContainText("What does this analysis show?");
  });
});
