import { test, expect } from '@playwright/test';

test.describe('Direct node navigation test', () => {
  test('should show sidebar when navigating directly to node URL', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    console.log('Navigating directly to node URL...');
    await page.goto('http://localhost:5175/nodes/GBPLJDBFZO2H7QQH7YFCH3HFT6EMC42Z2DNJ2QFROCKETAPY54V4DCZD?center=1&no-scroll=0&network=public');

    // Wait for page load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'node-page-direct.png', fullPage: true });
    console.log('Screenshot saved');

    // Log any errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Log recent console messages
    console.log('Recent console messages:');
    consoleMessages.slice(-20).forEach(msg => console.log('  ', msg));

    // Check if sidebar is visible
    const sidebar = page.locator('.side-bar, aside, [class*="sidebar"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log('Sidebar visible:', sidebarVisible);

    if (!sidebarVisible) {
      // Try to find any element that might be the sidebar
      const allElements = await page.locator('body *').all();
      console.log('Total elements on page:', allElements.length);

      // Check for any side-bar related classes
      const sideBarClasses = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="side"]');
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          class: el.className,
          visible: el.checkVisibility ? el.checkVisibility() : true
        })).slice(0, 10);
      });
      console.log('Elements with "side" in class:', JSON.stringify(sideBarClasses, null, 2));
    }

    // Check if the page title/content loaded
    const bodyText = await page.locator('body').textContent();
    console.log('Body text sample:', bodyText?.substring(0, 200));

    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('should show homepage when navigating to root', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5175/?network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'homepage-direct.png', fullPage: true });

    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Check for network explorer title
    const networkExplorer = page.locator('text=Network explorer').first();
    const networkExplorerVisible = await networkExplorer.isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Network explorer visible:', networkExplorerVisible);

    const bodyText = await page.locator('body').textContent();
    console.log('Body text sample:', bodyText?.substring(0, 200));

    await expect(networkExplorer).toBeVisible();
  });
});
