import { test, expect } from '@playwright/test';

test.describe('Modal verification tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');

    // Wait for the page to be fully loaded
    await page.waitForSelector('.navbar', { timeout: 10000 });
  });

  test('should open modify network modal from main page', async ({ page }) => {
    console.log('Looking for modify network link...');

    // Find and click the "Modify network" link in the sidebar
    const modifyNetworkLink = page.locator('text=Modify network').first();
    await expect(modifyNetworkLink).toBeVisible({ timeout: 10000 });

    console.log('Clicking modify network link...');
    await modifyNetworkLink.click();

    // Wait a bit for modal to appear
    await page.waitForTimeout(500);

    // Check if modal is visible - look for modal dialog
    const modal = page.locator('.modal-dialog, [role="dialog"]').first();
    console.log('Checking if modal is visible...');

    const isVisible = await modal.isVisible();
    console.log('Modal visible:', isVisible);

    if (isVisible) {
      // Check for modal title or content
      const modalContent = await modal.textContent();
      console.log('Modal content:', modalContent?.substring(0, 200));
    }

    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should open stellar core quorum set modal from node page', async ({ page }) => {
    console.log('Navigating to a node page...');

    // Navigate to nodes view first
    const nodesButton = page.locator('text=Nodes').first();
    if (await nodesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking Nodes button...');
      await nodesButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for the table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get the first validator row and click it to navigate to node page
    const firstValidator = page.locator('table tbody tr').first();
    console.log('Clicking first validator in table...');
    await firstValidator.click();

    // Wait for navigation to node page
    await page.waitForURL(/\/nodes\//, { timeout: 10000 });
    console.log('Current URL after click:', page.url());

    // Wait for sidebar to load
    await page.waitForTimeout(1000);

    console.log('Looking for stellar core config link...');

    // Look for "Stellar core config" link in the sidebar
    const stellarCoreLink = page.locator('text=/Stellar core config/i').first();

    const linkVisible = await stellarCoreLink.isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Stellar core link visible:', linkVisible);

    if (!linkVisible) {
      console.log('Could not find stellar core config link');
      console.log('Current URL:', page.url());
      const sidebarText = await page.locator('.side-bar, aside, [class*="sidebar"]').textContent().catch(() => 'No sidebar found');
      console.log('Sidebar content:', sidebarText?.substring(0, 500));
    }

    await expect(stellarCoreLink).toBeVisible({ timeout: 10000 });

    console.log('Clicking stellar core config link...');
    await stellarCoreLink.click();

    // Wait a bit for modal to appear
    await page.waitForTimeout(500);

    // Check if modal is visible
    const modal = page.locator('.modal-dialog, [role="dialog"]').first();
    console.log('Checking if stellar core modal is visible...');

    const isVisible = await modal.isVisible();
    console.log('Modal visible:', isVisible);

    if (isVisible) {
      const modalContent = await modal.textContent();
      console.log('Modal content:', modalContent?.substring(0, 200));

      // Should contain "Stellar Core Config" in title
      await expect(modal).toContainText(/Stellar Core Config/i);
    }

    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should open quorum slices modal from node page', async ({ page }) => {
    console.log('Navigating to a node page for quorum slices test...');

    // Navigate to nodes view
    const nodesButton = page.locator('text=Nodes').first();
    if (await nodesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking Nodes button...');
      await nodesButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for the table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click on first validator
    const firstValidator = page.locator('table tbody tr').first();
    console.log('Clicking first validator in table...');
    await firstValidator.click();

    // Wait for navigation to node page
    await page.waitForURL(/\/nodes\//, { timeout: 10000 });
    console.log('Current URL after click:', page.url());

    // Wait for sidebar to load
    await page.waitForTimeout(1000);

    console.log('Looking for quorum slices link...');

    // Look for "Quorum slices" link
    const quorumSlicesLink = page.locator('text=/Quorum slices/i').first();

    const linkVisible = await quorumSlicesLink.isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Quorum slices link visible:', linkVisible);

    if (!linkVisible) {
      console.log('Could not find quorum slices link');
      console.log('Current URL:', page.url());
      const sidebarText = await page.locator('.side-bar, aside, [class*="sidebar"]').textContent().catch(() => 'No sidebar found');
      console.log('Sidebar content:', sidebarText?.substring(0, 500));
    }

    await expect(quorumSlicesLink).toBeVisible({ timeout: 10000 });

    console.log('Clicking quorum slices link...');
    await quorumSlicesLink.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Check if modal is visible
    const modal = page.locator('.modal-dialog, [role="dialog"]').first();
    console.log('Checking if quorum slices modal is visible...');

    const isVisible = await modal.isVisible();
    console.log('Modal visible:', isVisible);

    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});
