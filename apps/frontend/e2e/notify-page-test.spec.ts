import { test, expect } from '@playwright/test';

test.describe('Notify Page Rendering', () => {
  test('check notify subscribe page rendering', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173/notify');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('=== Console Errors ===');
      consoleErrors.forEach(err => console.log(err));
    }

    // Take screenshot first to see what's rendered
    await page.screenshot({ path: 'test-results/notify-page-initial.png', fullPage: true });

    // Log page HTML
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Page HTML length:', bodyHTML.length);
    console.log('Page HTML sample:', bodyHTML.substring(0, 500));

    // Check if main elements are visible
    const pageTitle = page.locator('.page-title');
    const hasTitleElement = await pageTitle.count();
    console.log('Page title count:', hasTitleElement);

    if (hasTitleElement > 0) {
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toHaveText('Notify');
    }

    // Check form elements
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check for form groups
    const nodesGroup = page.locator('#nodes-group');
    const orgsGroup = page.locator('#organizations-group');
    const networkGroup = page.locator('#network-group');
    const emailGroup = page.locator('#email-group');
    const consentGroup = page.locator('#consent-group');

    console.log('Nodes group visible:', await nodesGroup.isVisible());
    console.log('Orgs group visible:', await orgsGroup.isVisible());
    console.log('Network group visible:', await networkGroup.isVisible());
    console.log('Email group visible:', await emailGroup.isVisible());
    console.log('Consent group visible:', await consentGroup.isVisible());

    // Check if multiselect is present
    const multiselect = page.locator('.multiselect');
    console.log('Multiselect count:', await multiselect.count());

    // Take screenshot
    await page.screenshot({ path: 'test-results/notify-page-rendering.png', fullPage: true });

    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Reload to catch any errors
    await page.reload();
    await page.waitForTimeout(1000);

    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
  });
});
