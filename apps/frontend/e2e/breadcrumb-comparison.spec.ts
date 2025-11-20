import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Comparison', () => {
  test('compare breadcrumb content between local and production', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test on local
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for breadcrumb to render

    const localBreadcrumb = page.locator('.sb-bread-crumbs, nav[aria-label="breadcrumb"]');
    await expect(localBreadcrumb).toBeVisible();

    const localBreadcrumbText = await localBreadcrumb.textContent();
    const localBreadcrumbHTML = await localBreadcrumb.innerHTML();

    // Take screenshot
    await localBreadcrumb.screenshot({ path: 'test-results/local-breadcrumb.png' });

    // Test on production
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const prodBreadcrumb = page.locator('.sb-bread-crumbs, nav[aria-label="breadcrumb"]');
    await expect(prodBreadcrumb).toBeVisible();

    const prodBreadcrumbText = await prodBreadcrumb.textContent();
    const prodBreadcrumbHTML = await prodBreadcrumb.innerHTML();

    // Take screenshot
    await prodBreadcrumb.screenshot({ path: 'test-results/prod-breadcrumb.png' });

    // Log comparison
    console.log('=== Breadcrumb Comparison ===');
    console.log('LOCAL Text:', localBreadcrumbText);
    console.log('PRODUCTION Text:', prodBreadcrumbText);
    console.log('');
    console.log('LOCAL HTML:', localBreadcrumbHTML);
    console.log('');
    console.log('PRODUCTION HTML:', prodBreadcrumbHTML);

    if (localBreadcrumbText !== prodBreadcrumbText) {
      console.log('');
      console.log('=== BREADCRUMB TEXT DIFFERS ===');
      console.log('Local shows:', localBreadcrumbText?.trim() || '(empty)');
      console.log('Production shows:', prodBreadcrumbText?.trim() || '(empty)');
    }
  });

  test('check breadcrumb items structure', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Local
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const localItems = await page.locator('.breadcrumb-item, .sb-bread-crumbs li').all();
    console.log('LOCAL Breadcrumb Items:', localItems.length);
    for (let i = 0; i < localItems.length; i++) {
      const text = await localItems[i].textContent();
      console.log(`  Item ${i}:`, text?.trim());
    }

    // Production
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const prodItems = await page.locator('.breadcrumb-item, .sb-bread-crumbs li').all();
    console.log('');
    console.log('PRODUCTION Breadcrumb Items:', prodItems.length);
    for (let i = 0; i < prodItems.length; i++) {
      const text = await prodItems[i].textContent();
      console.log(`  Item ${i}:`, text?.trim());
    }
  });
});
