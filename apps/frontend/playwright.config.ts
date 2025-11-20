import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // E2E tests expect both backend and frontend to be running
  // Run `pnpm dev` from the project root to start both servers before running tests
  webServer: {
    command: 'echo "E2E tests require dev servers running. Start with: pnpm dev"',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // Always reuse - don't try to start servers
    timeout: 5000,
  },
});
