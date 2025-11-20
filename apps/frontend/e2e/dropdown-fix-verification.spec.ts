import { test, expect } from '@playwright/test';

test.describe('Dropdown Fix Verification', () => {
  test('validators dropdown should open when clicked', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Find the validators dropdown title
    const validatorsLink = page.locator('.sb-nav-link:has-text("Validators")').first();

    // Verify it's visible
    await expect(validatorsLink).toBeVisible();

    // Check that dropdown is initially hidden
    const dropdown = page.locator('.sb-nav-dropdown').filter({ has: page.locator('text=SDF') });
    const isVisibleBefore = await dropdown.isVisible();
    console.log(`Dropdown visible before click: ${isVisibleBefore}`);

    // Click to open
    await validatorsLink.click();
    await page.waitForTimeout(500);

    // Verify dropdown is now visible
    const isVisibleAfter = await dropdown.isVisible();
    console.log(`Dropdown visible after click: ${isVisibleAfter}`);

    // Take screenshot
    await page.screenshot({ path: 'e2e-results/dropdown-fix-after.png', fullPage: true });

    // Assert that dropdown opened
    expect(isVisibleAfter).toBe(true);

    // Verify we can see validator names
    await expect(page.locator('text=SDF')).toBeVisible();
  });

  test('organizations dropdown should open when clicked', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Find the organizations dropdown (there are two, we want the first one)
    const organizationsLink = page.locator('.sb-nav-link:has-text("Organizations")').first();

    await expect(organizationsLink).toBeVisible();

    // Click to open
    await organizationsLink.click();
    await page.waitForTimeout(500);

    // Verify dropdown opened by checking for organization names
    const dropdown = page.locator('.sb-nav-dropdown').filter({
      has: page.locator('text=Stellar Development Foundation')
    });

    await expect(dropdown).toBeVisible();
  });
});
