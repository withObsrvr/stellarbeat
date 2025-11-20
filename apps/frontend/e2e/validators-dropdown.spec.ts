import { test, expect } from '@playwright/test';

test.describe('Validators Dropdown', () => {
  test('should open validators dropdown when clicked', async ({ page }) => {
    // Set up console logging to see any errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find the validators dropdown title
    const validatorsTitle = page.locator('text=Validators').first();
    await expect(validatorsTitle).toBeVisible();

    // Check if dropdown is initially closed
    const dropdownContent = page.locator('.sb-nav-dropdown').filter({ has: page.locator('text=SDF') }).first();
    const isVisibleBefore = await dropdownContent.isVisible().catch(() => false);
    console.log(`Validators dropdown visible before click: ${isVisibleBefore}`);

    // Click on the validators title
    await validatorsTitle.click();
    await page.waitForTimeout(500);

    // Check if dropdown opened
    const isVisibleAfter = await dropdownContent.isVisible().catch(() => false);
    console.log(`Validators dropdown visible after click: ${isVisibleAfter}`);

    // Take screenshot
    await page.screenshot({ path: 'e2e-results/validators-dropdown-clicked.png' });

    expect(isVisibleAfter).toBe(true);
  });
});
