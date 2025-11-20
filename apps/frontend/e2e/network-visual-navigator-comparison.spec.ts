import { test, expect } from '@playwright/test';

test.describe('Network Visual Navigator Menu Button Comparison', () => {
  test('compare menu button styling between local and production', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test on local
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Find the menu button in the network visual navigator
    const localMenuButton = page.locator('.menu-button.text-gray');
    await expect(localMenuButton).toBeVisible();

    const localStyles = await localMenuButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        cursor: computed.cursor,
      };
    });

    // Check the icon inside
    const localIcon = localMenuButton.locator('i, svg');
    const localIconStyles = await localIcon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        width: computed.width,
        height: computed.height,
      };
    });

    // Test on production
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');

    const prodMenuButton = page.locator('.menu-button.text-gray');
    await expect(prodMenuButton).toBeVisible();

    const prodStyles = await prodMenuButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        cursor: computed.cursor,
      };
    });

    // Check the icon inside
    const prodIcon = prodMenuButton.locator('i, svg');
    const prodIconStyles = await prodIcon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        width: computed.width,
        height: computed.height,
      };
    });

    // Log comparison
    console.log('=== Menu Button Style Comparison ===');
    console.log('LOCAL Button:', JSON.stringify(localStyles, null, 2));
    console.log('PRODUCTION Button:', JSON.stringify(prodStyles, null, 2));
    console.log('LOCAL Icon:', JSON.stringify(localIconStyles, null, 2));
    console.log('PRODUCTION Icon:', JSON.stringify(prodIconStyles, null, 2));

    // Check for differences in button
    const buttonDifferences = [];
    for (const key of Object.keys(localStyles)) {
      if (localStyles[key] !== prodStyles[key]) {
        buttonDifferences.push({
          property: key,
          local: localStyles[key],
          production: prodStyles[key]
        });
      }
    }

    // Check for differences in icon
    const iconDifferences = [];
    for (const key of Object.keys(localIconStyles)) {
      if (localIconStyles[key] !== prodIconStyles[key]) {
        iconDifferences.push({
          property: key,
          local: localIconStyles[key],
          production: prodIconStyles[key]
        });
      }
    }

    if (buttonDifferences.length > 0) {
      console.log('=== BUTTON DIFFERENCES FOUND ===');
      console.table(buttonDifferences);
    }

    if (iconDifferences.length > 0) {
      console.log('=== ICON DIFFERENCES FOUND ===');
      console.table(iconDifferences);
    }

    if (buttonDifferences.length === 0 && iconDifferences.length === 0) {
      console.log('✓ No differences found - styling matches!');
    }
  });

  test('take screenshots of menu button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Local screenshot
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    const localMenuButton = page.locator('.menu-button.text-gray');
    await expect(localMenuButton).toBeVisible();
    await localMenuButton.screenshot({ path: 'test-results/local-menu-button.png' });

    // Production screenshot
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');

    const prodMenuButton = page.locator('.menu-button.text-gray');
    await expect(prodMenuButton).toBeVisible();
    await prodMenuButton.screenshot({ path: 'test-results/prod-menu-button.png' });
  });
});
