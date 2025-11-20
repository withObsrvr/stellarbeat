import { test, expect } from '@playwright/test';

test('Debug Stellar core config modal click', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[${msg.type()}] ${text}`);
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
    console.log(`PAGE ERROR: ${err.message}`);
  });

  console.log('Navigating to node page...');
  await page.goto('http://localhost:5175/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check if the link is visible
  const stellarCoreLink = page.locator('.side-bar').getByText('Stellar core config').first();
  const linkVisible = await stellarCoreLink.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Stellar core config link visible:', linkVisible);

  if (!linkVisible) {
    console.log('Link not visible - feature may be disabled');
    return;
  }

  // Click the link
  console.log('Clicking Stellar core config link...');
  await stellarCoreLink.click();
  await page.waitForTimeout(2000);

  // Check if modal element exists
  const modalExists = await page.locator('#tomlExportModal').count() > 0;
  console.log('Modal element exists in DOM:', modalExists);

  if (modalExists) {
    const modalEl = page.locator('#tomlExportModal');
    const modalHtml = await modalEl.evaluate(el => el.outerHTML.substring(0, 200));
    console.log('Modal HTML (first 200 chars):', modalHtml);
  }

  // Print all captured console messages
  console.log('\n=== All Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(err => console.log(err));
  }

  // Look for VBModal messages specifically
  const vbModalMessages = consoleMessages.filter(msg => msg.includes('VBModal'));
  console.log('\n=== VBModal Messages ===');
  vbModalMessages.forEach(msg => console.log(msg));
});
