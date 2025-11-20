import { test, expect } from '@playwright/test';

test.describe('Node sidebar tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.navbar', { timeout: 10000 });
  });

  test('should show sidebar when clicking on a node', async ({ page }) => {
    console.log('Initial page load complete');

    // Navigate to Nodes view
    const nodesButton = page.locator('text=Nodes').first();
    const nodesVisible = await nodesButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (nodesVisible) {
      console.log('Clicking Nodes button...');
      await nodesButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for the nodes table to load
    console.log('Waiting for nodes table...');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-node-click.png', fullPage: true });
    console.log('Screenshot before click saved');

    // Check if sidebar is visible before clicking
    const sidebarBefore = page.locator('.side-bar, aside, [class*="sidebar"]').first();
    const sidebarVisibleBefore = await sidebarBefore.isVisible().catch(() => false);
    console.log('Sidebar visible before click:', sidebarVisibleBefore);

    if (sidebarVisibleBefore) {
      const sidebarTextBefore = await sidebarBefore.textContent();
      console.log('Sidebar content before click (first 100 chars):', sidebarTextBefore?.substring(0, 100));
    }

    // Click on the first node in the table
    const firstNode = page.locator('table tbody tr').first();
    console.log('Clicking on first node...');
    await firstNode.click();

    // Wait for any navigation or state changes
    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-node-click.png', fullPage: true });
    console.log('Screenshot after click saved');

    // Check if sidebar is visible after clicking
    const sidebarAfter = page.locator('.side-bar, aside, [class*="sidebar"]').first();
    const sidebarVisibleAfter = await sidebarAfter.isVisible().catch(() => false);
    console.log('Sidebar visible after click:', sidebarVisibleAfter);

    if (sidebarVisibleAfter) {
      const sidebarTextAfter = await sidebarAfter.textContent();
      console.log('Sidebar content after click (first 100 chars):', sidebarTextAfter?.substring(0, 100));
    } else {
      console.log('Sidebar is NOT visible after clicking node!');

      // Try to find any sidebar-related elements
      const allSidebars = await page.locator('[class*="side"], [class*="bar"]').all();
      console.log('Number of elements with "side" or "bar" in class:', allSidebars.length);

      for (const el of allSidebars.slice(0, 5)) {
        const classes = await el.getAttribute('class');
        const visible = await el.isVisible().catch(() => false);
        console.log('Element class:', classes, 'visible:', visible);
      }
    }

    // Check current URL
    console.log('Current URL after click:', page.url());

    // The sidebar should still be visible after clicking a node
    await expect(sidebarAfter).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to node page when clicking on a node', async ({ page }) => {
    console.log('Testing node navigation...');

    // Navigate to Nodes view
    const nodesButton = page.locator('text=Nodes').first();
    const nodesVisible = await nodesButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (nodesVisible) {
      console.log('Clicking Nodes button...');
      await nodesButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for the nodes table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const urlBefore = page.url();
    console.log('URL before clicking node:', urlBefore);

    // Click on the first node
    const firstNode = page.locator('table tbody tr').first();
    await firstNode.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    const urlAfter = page.url();
    console.log('URL after clicking node:', urlAfter);

    // URL should have changed to include /nodes/
    expect(urlAfter).not.toBe(urlBefore);
    console.log('URL changed successfully');
  });
});
