import { defineConfig, devices } from '@playwright/test';

/**
 * For driving a dev server you already have running.
 *
 * The default config declares a webServer whose command just echoes a hint and
 * exits, which Playwright treats as "server died" and refuses to run. This one
 * has no webServer, points at the port `pnpm --filter frontend run dev` uses,
 * and drives the system Chrome so the browser does not need downloading --
 * Playwright's own build does not link cleanly on NixOS.
 *
 *   ./node_modules/.bin/playwright test -c playwright.local.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  timeout: 120_000,
  use: {
    baseURL: process.env.RADAR_E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    // `channel: 'chrome'` looks for /opt/google/chrome/chrome, which does not
    // exist on NixOS. Point at the real binary instead; override with
    // RADAR_E2E_CHROME elsewhere.
    launchOptions: {
      executablePath:
        process.env.RADAR_E2E_CHROME ?? '/run/current-system/sw/bin/google-chrome-stable',
    },
  },
});
