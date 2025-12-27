import { test, expect } from '@playwright/test';

test.describe('Hamburger Menu Visual Comparison', () => {
  test('compare hamburger menu button styling - homepage', async ({ page, viewport }) => {
    // Set mobile viewport to show hamburger menu
    await page.setViewportSize({ width: 375, height: 667 });

    // Test on local
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of hamburger button (closed state)
    const hamburgerButton = page.locator('button.navbar-toggler');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.screenshot({ path: 'test-results/local-hamburger-closed.png' });

    // Click to open menu
    await hamburgerButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Take screenshot of opened menu
    await page.screenshot({
      path: 'test-results/local-hamburger-open.png',
      fullPage: false
    });

    // Test on production
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of hamburger button (closed state)
    const prodHamburgerButton = page.locator('button.navbar-toggler');
    await expect(prodHamburgerButton).toBeVisible();
    await prodHamburgerButton.screenshot({ path: 'test-results/prod-hamburger-closed.png' });

    // Click to open menu
    await prodHamburgerButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Take screenshot of opened menu
    await page.screenshot({
      path: 'test-results/prod-hamburger-open.png',
      fullPage: false
    });
  });

  test('compare hamburger menu on trust graph page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to trust graph on local
    await page.goto('/federated-voting');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for graph to render

    // Screenshot hamburger button
    const localHamburger = page.locator('button.navbar-toggler');
    await expect(localHamburger).toBeVisible();
    await localHamburger.screenshot({ path: 'test-results/local-trust-graph-hamburger-closed.png' });

    // Open menu
    await localHamburger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/local-trust-graph-hamburger-open.png' });

    // Navigate to trust graph on production
    await page.goto('https://radar.withobsrvr.com/federated-voting');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot hamburger button
    const prodHamburger = page.locator('button.navbar-toggler');
    await expect(prodHamburger).toBeVisible();
    await prodHamburger.screenshot({ path: 'test-results/prod-trust-graph-hamburger-closed.png' });

    // Open menu
    await prodHamburger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/prod-trust-graph-hamburger-open.png' });
  });

  test('inspect hamburger menu CSS properties', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check local styling
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const localButton = page.locator('button.navbar-toggler');
    const localStyles = await localButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        padding: computed.padding,
        border: computed.border,
        borderRadius: computed.borderRadius,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontSize: computed.fontSize,
        width: computed.width,
        height: computed.height,
      };
    });

    // Check production styling
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');

    const prodButton = page.locator('button.navbar-toggler');
    const prodStyles = await prodButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        padding: computed.padding,
        border: computed.border,
        borderRadius: computed.borderRadius,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontSize: computed.fontSize,
        width: computed.width,
        height: computed.height,
      };
    });

    // Log comparison
    console.log('=== Hamburger Button Style Comparison ===');
    console.log('LOCAL:', JSON.stringify(localStyles, null, 2));
    console.log('PRODUCTION:', JSON.stringify(prodStyles, null, 2));

    // Check for differences
    const differences = [];
    for (const key of Object.keys(localStyles)) {
      if (localStyles[key] !== prodStyles[key]) {
        differences.push({
          property: key,
          local: localStyles[key],
          production: prodStyles[key]
        });
      }
    }

    if (differences.length > 0) {
      console.log('=== DIFFERENCES FOUND ===');
      console.table(differences);
    } else {
      console.log('✓ No differences found - styling matches!');
    }
  });

  test('inspect hamburger icon (BIconList) properties', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check local icon
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const localIcon = page.locator('button.navbar-toggler svg, button.navbar-toggler .b-icon');
    const localIconStyles = await localIcon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        fill: computed.fill,
        stroke: computed.stroke,
        color: computed.color,
        fontSize: computed.fontSize,
      };
    });

    // Check production icon
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');

    const prodIcon = page.locator('button.navbar-toggler svg, button.navbar-toggler .b-icon');
    const prodIconStyles = await prodIcon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        fill: computed.fill,
        stroke: computed.stroke,
        color: computed.color,
        fontSize: computed.fontSize,
      };
    });

    console.log('=== Hamburger Icon Style Comparison ===');
    console.log('LOCAL:', JSON.stringify(localIconStyles, null, 2));
    console.log('PRODUCTION:', JSON.stringify(prodIconStyles, null, 2));
  });
});
