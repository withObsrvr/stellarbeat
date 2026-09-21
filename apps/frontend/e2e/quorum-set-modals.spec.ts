import { test, expect } from "@playwright/test";

/**
 * Covers the node detail page's Stellar core config dialog.
 *
 * Context worth recording: the quorum-set sidebar had three dialogs of its own
 * (Stellar core config, Add Validators, Add organization) built as raw
 * Bootstrap `.modal` markup shown with `$(el).modal("show")`. Bootstrap's
 * JavaScript is never loaded -- only its CSS -- so none of them could open.
 * They have been converted to UiModal, but they are not covered here because
 * the component that renders them, node-side-bar.vue, is referenced by nothing:
 * the whole chain is orphaned, which is why the breakage went unnoticed.
 *
 * The node detail redesign grew its own Stellar core config path, and that one
 * is reachable. It is what a user actually hits, so it is what gets a test.
 *
 *   ./node_modules/.bin/playwright test e2e/quorum-set-modals.spec.ts \
 *     -c playwright.local.config.ts
 */

const VALIDATOR =
  process.env.RADAR_E2E_VALIDATOR ??
  "GAS6NVPITN4VY6IVWPANSZLU6RFJ7NLLJZMJ7GA5Y77E4W2G6DDSK44Q";

test.describe("node detail dialogs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/nodes/${VALIDATOR}`, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("heading", { name: "Node Details" })
      .waitFor({ timeout: 45_000 });
  });

  test("Stellar core config opens and renders a config", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(`${e.name}: ${e.message}`));

    await page.getByRole("button", { name: "Node actions" }).first().click();
    await page
      .getByRole("button", { name: "Stellar core config" })
      .first()
      .click();

    // The generated config proves the load hook ran, not just that a dialog
    // appeared -- that hook used to be a Bootstrap `show.bs.modal` handler.
    // nodesToToml emits HOME_DOMAINS and VALIDATORS sections.
    const config = page.locator("pre").first();
    await expect(config).toContainText("VALIDATORS", { timeout: 15_000 });
    await expect(config).toContainText("PUBLIC_KEY");

    expect(pageErrors).toEqual([]);
  });

  test("closing the dialog releases the page scroll lock", async ({ page }) => {
    await page.getByRole("button", { name: "Node actions" }).first().click();
    await page
      .getByRole("button", { name: "Stellar core config" })
      .first()
      .click();

    const config = page.locator("pre").first();
    await expect(config).toBeVisible({ timeout: 15_000 });

    //UiModal sets body overflow hidden while open; a dialog that fails to
    //close leaves the page unscrollable, which is worse than not opening
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.getByRole("button", { name: /^(Close|OK)$/ }).first().click();

    await expect(config).toBeHidden({ timeout: 10_000 });
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
});
