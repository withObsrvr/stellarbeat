import { test, expect } from "@playwright/test";

/**
 * Drives the main-page network analysis tool and reports what actually
 * happens, rather than asserting a pass. Uses the system Chrome so the
 * browser does not have to be downloaded, and the locally running dev server
 * on 8080 rather than the config's 5173.
 */
test.use({ channel: "chrome", baseURL: "http://localhost:8080" });

test("network analysis tool runs", async ({ page }) => {
  const consoleLines: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => pageErrors.push(`${err.name}: ${err.message}`));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(8000);

  // The dashboard links only exist inside warning alerts, so on a healthy
  // network the sidebar entry is the only way in.
  const opened = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll("a, button, [role='button'], li"),
    ).filter((el) => (el.textContent || "").trim() === "Network analysis");
    if (!candidates.length) return "no sidebar entry found";
    (candidates[candidates.length - 1] as HTMLElement).click();
    return `clicked sidebar entry (${candidates.length} candidates)`;
  });
  console.log("OPEN:", opened);
  await page.waitForTimeout(2500);

  const panel = page.locator("text=Perform analysis");
  const panelVisible = await panel.isVisible().catch(() => false);
  console.log("PANEL VISIBLE:", panelVisible);

  // How big is the problem we are handing to wasm?
  const scale = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll("input[type=radio]"));
    return { mergeByRadios: radios.length };
  });
  console.log("SCALE:", JSON.stringify(scale));

  // Node-level analysis over all of pubnet is exponential. Merge by
  // organization first, which is the tractable case.
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("label"));
    const orgs = labels.find((l) => /Organizations/i.test(l.textContent || ""));
    const radio = orgs?.querySelector("input[type=radio]") as HTMLInputElement;
    if (radio) {
      radio.click();
      return "selected Organizations";
    }
    return "no Organizations radio";
  }).then((r) => console.log("MERGE BY:", r));
  await page.waitForTimeout(1000);

  if (panelVisible) {
    await panel.click();
    // The wasm analysis over the full pubnet transitive quorum set is not fast.
    for (let waited = 0; waited < 90000; waited += 5000) {
      await page.waitForTimeout(5000);
      const done = await page.evaluate(() =>
        /Minimal quorums|Blocking sets|Could not start the analysis/i.test(
          document.body.textContent || "",
        ),
      );
      if (done) {
        console.log("RESULTS AFTER (ms):", waited + 5000);
        break;
      }
    }
  }

  const state = await page.evaluate(() => {
    const text = document.body.textContent || "";
    const grab = (re: RegExp) => (text.match(re) || [])[0] || null;
    return {
      hasMinimalQuorums: /Minimal quorums/i.test(text),
      hasBlockingSets: /Blocking sets/i.test(text),
      quorumIntersection: grab(/(All quorums intersect|No quorum intersection)/i),
      livenessLine: grab(/Found set\(s\) of size \d+ that could impact liveness/i),
      analysisError: grab(/Could not start the analysis:[^\n]*/i),
      coreForksIf: grab(/Core forks if[\s\S]{0,60}/i),
      stillLoading: document.querySelectorAll(".loader").length > 0 &&
        !/dimmer-content/.test(""),
      topTierLine: grab(/Top tier has size \d+/i),
      quorumSections: /Quorum intersection/i.test(text),
    };
  });

  console.log("STATE:", JSON.stringify(state, null, 2));
  console.log("PAGE ERRORS:", JSON.stringify(pageErrors, null, 2));
  console.log(
    "CONSOLE (errors/warnings):",
    JSON.stringify(
      consoleLines.filter((l) => /^\[(error|warning)\]/.test(l)).slice(0, 25),
      null,
      2,
    ),
  );

  await page.screenshot({ path: "e2e-analysis.png", fullPage: true });
  expect(pageErrors.length).toBeLessThan(999); // always passes; this is a probe
});
