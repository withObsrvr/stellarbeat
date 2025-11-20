import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Layout Comparison', () => {
  test('compare breadcrumb and menu button layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test on local
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const localHeader = page.locator('.card-header').first();
    await expect(localHeader).toBeVisible();

    // Get the card-header container styles
    const localHeaderStyles = await localHeader.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
        padding: computed.padding,
        margin: computed.margin,
      };
    });

    // Get breadcrumb container styles
    const localBreadcrumbContainer = page.locator('.sb-bread-crumbs-container');
    const localBreadcrumbStyles = await localBreadcrumbContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexGrow: computed.flexGrow,
        alignItems: computed.alignItems,
        paddingLeft: computed.paddingLeft,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
      };
    });

    // Get menu button styles
    const localMenuButton = page.locator('.menu-button');
    const localMenuButtonStyles = await localMenuButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        marginLeft: computed.marginLeft,
        display: computed.display,
        alignSelf: computed.alignSelf,
      };
    });

    // Take screenshot
    await localHeader.screenshot({ path: 'test-results/local-header-layout.png' });

    // Test on production
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const prodHeader = page.locator('.card-header').first();
    await expect(prodHeader).toBeVisible();

    const prodHeaderStyles = await prodHeader.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
        padding: computed.padding,
        margin: computed.margin,
      };
    });

    const prodBreadcrumbContainer = page.locator('.sb-bread-crumbs-container');
    const prodBreadcrumbStyles = await prodBreadcrumbContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexGrow: computed.flexGrow,
        alignItems: computed.alignItems,
        paddingLeft: computed.paddingLeft,
        paddingTop: computed.paddingTop,
        paddingBottom: computed.paddingBottom,
      };
    });

    const prodMenuButton = page.locator('.menu-button');
    const prodMenuButtonStyles = await prodMenuButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        marginLeft: computed.marginLeft,
        display: computed.display,
        alignSelf: computed.alignSelf,
      };
    });

    await prodHeader.screenshot({ path: 'test-results/prod-header-layout.png' });

    // Log comparison
    console.log('=== Card Header Styles ===');
    console.log('LOCAL:', JSON.stringify(localHeaderStyles, null, 2));
    console.log('PRODUCTION:', JSON.stringify(prodHeaderStyles, null, 2));
    console.log('');

    console.log('=== Breadcrumb Container Styles ===');
    console.log('LOCAL:', JSON.stringify(localBreadcrumbStyles, null, 2));
    console.log('PRODUCTION:', JSON.stringify(prodBreadcrumbStyles, null, 2));
    console.log('');

    console.log('=== Menu Button Styles ===');
    console.log('LOCAL:', JSON.stringify(localMenuButtonStyles, null, 2));
    console.log('PRODUCTION:', JSON.stringify(prodMenuButtonStyles, null, 2));
  });
});
