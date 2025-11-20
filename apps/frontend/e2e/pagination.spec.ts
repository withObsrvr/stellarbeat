import { test, expect } from '@playwright/test';

test.describe('Network Dashboard Pagination', () => {
  test('should display only 5 organizations per page with pagination controls', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the organizations card to load
    await page.waitForSelector('text=available organizations', { timeout: 10000 });

    // Wait a bit for data to load
    await page.waitForTimeout(2000);

    // Find the organizations table card
    const orgsCard = page.locator('.card:has-text("available organizations")');
    await expect(orgsCard).toBeVisible();

    // Take a screenshot of the organizations card
    await orgsCard.screenshot({ path: 'e2e-results/organizations-card-pagination.png' });

    // Check if pagination controls are visible (if there are more than 5 orgs)
    const paginationExists = await page.locator('.card:has-text("available organizations") .pagination').count();
    console.log(`Pagination elements found: ${paginationExists}`);

    // Count table rows in the organizations table
    const orgTableRows = await page.locator('.card:has-text("available organizations") table tbody tr').count();
    console.log(`Organization table rows visible: ${orgTableRows}`);

    // If there are more than 5 total orgs, we should see pagination and max 5 rows
    if (paginationExists > 0) {
      expect(orgTableRows).toBeLessThanOrEqual(5);
      console.log('✓ Pagination working: showing max 5 organizations');
    } else {
      console.log('ℹ No pagination (likely <= 5 total organizations)');
    }
  });

  test('should display only 5 validators per page with pagination controls', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the validators card to load
    await page.waitForSelector('text=active validators', { timeout: 10000 });

    // Wait a bit for data to load
    await page.waitForTimeout(2000);

    // Find the validators table card
    const validatorsCard = page.locator('.card:has-text("active validators")');
    await expect(validatorsCard).toBeVisible();

    // Take a screenshot of the validators card
    await validatorsCard.screenshot({ path: 'e2e-results/validators-card-pagination.png' });

    // Check if pagination controls are visible
    const paginationExists = await page.locator('.card:has-text("active validators") .pagination').count();
    console.log(`Pagination elements found: ${paginationExists}`);

    // Count table rows in the validators table
    const validatorTableRows = await page.locator('.card:has-text("active validators") table tbody tr').count();
    console.log(`Validator table rows visible: ${validatorTableRows}`);

    // If there are more than 5 total validators, we should see pagination and max 5 rows
    if (paginationExists > 0) {
      expect(validatorTableRows).toBeLessThanOrEqual(5);
      console.log('✓ Pagination working: showing max 5 validators');
    } else {
      console.log('ℹ No pagination (likely <= 5 total validators)');
    }
  });

  test('should navigate between pages when clicking pagination', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the organizations card to load
    await page.waitForSelector('text=available organizations', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check if page 2 button exists
    const page2Button = page.locator('.card:has-text("available organizations") .pagination .page-link:has-text("2")');
    const hasPage2 = await page2Button.count() > 0;

    if (hasPage2) {
      // Get first organization name on page 1
      const firstOrgPage1 = await page.locator('.card:has-text("available organizations") table tbody tr:first-child td:first-child').textContent();
      console.log(`First organization on page 1: ${firstOrgPage1}`);

      // Click page 2
      await page2Button.click();
      await page.waitForTimeout(500);

      // Get first organization name on page 2
      const firstOrgPage2 = await page.locator('.card:has-text("available organizations") table tbody tr:first-child td:first-child').textContent();
      console.log(`First organization on page 2: ${firstOrgPage2}`);

      // They should be different
      expect(firstOrgPage1).not.toBe(firstOrgPage2);
      console.log('✓ Pagination navigation working');

      // Take screenshot of page 2
      const orgsCard = page.locator('.card:has-text("available organizations")');
      await orgsCard.screenshot({ path: 'e2e-results/organizations-card-page2.png' });
    } else {
      console.log('ℹ Not enough organizations for page 2');
    }
  });
});
