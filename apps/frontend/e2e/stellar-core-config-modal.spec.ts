import { test, expect } from '@playwright/test';

test('Stellar core config modal should open when clicking the link', async ({ page }) => {
  // Capture console logs for debugging
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate to node page
  await page.goto('http://localhost:5173/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Find the "Stellar core config" link in the Tools section of the sidebar
  const stellarCoreLink = page.locator('.sb-nav-item').filter({ hasText: 'Stellar core config' }).first();

  console.log('Looking for Stellar core config link...');
  await expect(stellarCoreLink).toBeVisible({ timeout: 5000 });

  console.log('Found link, clicking...');

  // Click the link
  await stellarCoreLink.click();
  await page.waitForTimeout(1000);

  // Print relevant console logs
  const relevantLogs = consoleMessages.filter(msg =>
    msg.includes('[nav-link]') || msg.includes('[BModal]') || msg.includes('tomlExportModal')
  );
  console.log('=== Modal-related Console Logs ===');
  relevantLogs.forEach(log => console.log(log));

  // Check if modal is visible
  const modal = page.locator('.modal.show').first();
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Verify modal title
  const modalTitle = modal.locator('.modal-title');
  await expect(modalTitle).toContainText(/Stellar Core Config/i);

  // Verify TOML content is present
  const tomlContent = modal.locator('pre code');
  await expect(tomlContent).toBeVisible();

  const content = await tomlContent.textContent();
  console.log('TOML content sample:', content?.substring(0, 200));

  console.log('✅ Test passed! Modal opened successfully.');
});
