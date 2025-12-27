import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Style Test', () => {
  test('check breadcrumb background and text color', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check breadcrumb container background
    const breadcrumbNav = page.locator('.sb-bread-crumbs');
    const navStyles = await breadcrumbNav.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        background: computed.background,
      };
    });

    // Check breadcrumb ol element
    const breadcrumbOl = page.locator('.sb-bread-crumbs .breadcrumb');
    const olStyles = await breadcrumbOl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        background: computed.background,
        marginBottom: computed.marginBottom,
      };
    });

    // Check breadcrumb link/text color
    const breadcrumbLink = page.locator('.breadcrumb-item a, .breadcrumb-item span').first();
    const linkStyles = await breadcrumbLink.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Check other text on page for comparison
    const cardHeaderText = page.locator('.card-header .text-gray').first();
    const headerTextStyles = await cardHeaderText.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
      };
    });

    console.log('=== Breadcrumb Nav Styles ===');
    console.log(JSON.stringify(navStyles, null, 2));
    console.log('');
    console.log('=== Breadcrumb OL Styles ===');
    console.log(JSON.stringify(olStyles, null, 2));
    console.log('');
    console.log('=== Breadcrumb Link/Text Styles ===');
    console.log(JSON.stringify(linkStyles, null, 2));
    console.log('');
    console.log('=== Card Header Text Styles (for comparison) ===');
    console.log(JSON.stringify(headerTextStyles, null, 2));

    // Take screenshot
    const cardHeader = page.locator('.card-header').first();
    await cardHeader.screenshot({ path: 'test-results/breadcrumb-style-test.png' });
  });
});
