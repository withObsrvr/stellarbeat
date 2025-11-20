import { test } from '@playwright/test';

test('debug node page', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to node page
  await page.goto('http://localhost:5173/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshots
  await page.screenshot({ path: 'test-results/node-page-full.png', fullPage: true });

  const sidebar = page.locator('.side-bar').first();
  if (await sidebar.isVisible().catch(() => false)) {
    await sidebar.screenshot({ path: 'test-results/node-sidebar.png' });
  }

  // Get page content
  const bodyText = await page.locator('body').textContent();
  console.log('=== Body Text Sample (first 500 chars) ===');
  console.log(bodyText?.substring(0, 500));

  // Check for key elements
  console.log('\n=== Checking Elements ===');
  console.log('Side bar visible:', await sidebar.isVisible().catch(() => false));
  console.log('Stellar core config text exists:', bodyText?.includes('Stellar core config'));
  console.log('enableConfigExport check...');

  // Print all sidebar items
  const sidebarItems = page.locator('.sb-nav-item');
  const count = await sidebarItems.count();
  console.log(`\nFound ${count} sidebar items`);

  for (let i = 0; i < count; i++) {
    const text = await sidebarItems.nth(i).textContent();
    console.log(`  ${i + 1}. ${text?.trim()}`);
  }

  // Print relevant console logs
  console.log('\n=== Console Logs ===');
  consoleLogs.slice(0, 20).forEach(log => console.log(log));
});
