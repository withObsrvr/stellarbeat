import { test, expect } from '@playwright/test';

test.describe('Quorum set dropdown tests', () => {
  test('should open nested quorum set dropdowns (organizations) when clicking on them', async ({ page }) => {
    const errors: string[] = [];

    // Capture page errors
    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('Navigating to node page...');
    await page.goto('http://localhost:5175/nodes/GBPLJDBFZO2H7QQH7YFCH3HFT6EMC42Z2DNJ2QFROCKETAPY54V4DCZD?center=1&no-scroll=0&network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-quorum-set-click.png', fullPage: true });
    console.log('Screenshot before click saved');

    // Check for errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // First ensure the root quorum set is expanded
    const quorumSetLink = page.locator('.side-bar .sb-nav-link').filter({ hasText: 'Quorum set' }).first();
    const quorumSetVisible = await quorumSetLink.isVisible().catch(() => false);
    console.log('Quorum set link visible:', quorumSetVisible);

    if (!quorumSetVisible) {
      throw new Error('Quorum set link not found in sidebar!');
    }

    // Now find a nested organization dropdown inside the quorum set dropdown
    // These will be inside .sb-nav-dropdown and should have organization names
    const nestedDropdown = page.locator('.side-bar .sb-nav-dropdown .sb-nav-dropdown-link').filter({ hasText: /Creit|LOBSTR|Franklin/ }).first();
    const nestedVisible = await nestedDropdown.isVisible().catch(() => false);
    console.log('Nested organization dropdown visible:', nestedVisible);

    if (!nestedVisible) {
      console.log('No nested organization dropdown found - test may not be applicable');
      return;
    }

    // Get the organization name
    const orgName = await nestedDropdown.textContent();
    console.log('Testing organization dropdown:', orgName?.substring(0, 50));

    // The nested dropdown should have its own dropdown content (grandchild)
    const nestedDropdownContent = nestedDropdown.locator('xpath=following-sibling::div[@class="sb-nav-dropdown"]').first();
    const contentVisibleBefore = await nestedDropdownContent.isVisible().catch(() => false);
    console.log('Nested dropdown content visible before click:', contentVisibleBefore);

    // Count items in nested dropdown if visible
    if (contentVisibleBefore) {
      const navLinks = await nestedDropdownContent.locator('.sb-nav-link').count();
      console.log('Nav links in nested dropdown before click:', navLinks);
    }

    // Click on the nested organization dropdown to toggle it
    console.log('Clicking on nested organization dropdown...');
    await nestedDropdown.click();
    await page.waitForTimeout(500);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-quorum-set-click.png', fullPage: true });
    console.log('Screenshot after click saved');

    // Check if nested dropdown content visibility changed
    const contentVisibleAfter = await nestedDropdownContent.isVisible().catch(() => false);
    console.log('Nested dropdown content visible after click:', contentVisibleAfter);

    // Count items in nested dropdown if visible
    if (contentVisibleAfter) {
      const items = await nestedDropdownContent.locator('.sb-nav-link').count();
      console.log('Items in nested dropdown after click:', items);
    }

    // Check for any errors during the click
    if (errors.length > 0) {
      console.log('ERRORS AFTER CLICK:');
      errors.forEach(err => console.log('  -', err));
    }

    // The dropdown should toggle visibility
    expect(contentVisibleAfter).not.toBe(contentVisibleBefore);
  });
});
