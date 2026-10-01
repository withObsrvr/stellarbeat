import { test, expect } from "@playwright/test";

/**
 * Renders the main pages after the Bootstrap and Tabler stylesheets were
 * removed and their used classes reimplemented on Radar tokens.
 *
 * This cannot judge whether a page looks *right* -- only a person can -- but it
 * catches the failure modes a 218kB CSS deletion actually produces: content
 * that disappears, layout that collapses to zero height, and script errors.
 * Screenshots are written for a human to review.
 */
const PAGES = [
  { name: "network-dashboard", path: "/", expect: "Network safe" },
  { name: "nodes", path: "/nodes", expect: "" },
  { name: "organizations", path: "/organizations", expect: "" },
  {
    name: "node-detail",
    path: "/nodes/GAS6NVPITN4VY6IVWPANSZLU6RFJ7NLLJZMJ7GA5Y77E4W2G6DDSK44Q",
    expect: "Node Details",
  },
  { name: "faq", path: "/faq", expect: "" },
];

for (const target of PAGES) {
  test(`${target.name} renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`${e.name}: ${e.message}`));

    await page.goto(target.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(9000);

    const health = await page.evaluate(() => {
      const body = document.body;
      return {
        height: body.scrollHeight,
        textLength: (body.innerText || "").trim().length,
        //an element collapsed to zero height is the classic symptom of a
        //layout class that no longer resolves
        zeroHeightSections: Array.from(
          document.querySelectorAll("main div, section"),
        ).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 200 && r.height === 0 && (el.textContent || "").trim();
        }).length,
      };
    });

    await page.screenshot({
      path: `e2e-screens/${target.name}.png`,
      fullPage: true,
    });

    expect(errors, `page errors on ${target.path}`).toEqual([]);
    expect(health.height, "page has height").toBeGreaterThan(400);
    expect(health.textLength, "page has content").toBeGreaterThan(200);
    expect(health.zeroHeightSections, "collapsed sections").toBe(0);
    if (target.expect) {
      await expect(page.getByText(target.expect).first()).toBeVisible();
    }
  });
}
