import { test, expect } from '@playwright/test';

test.describe('Navbar Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size to ensure navbar is visible
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Listen for console messages to debug
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Listen for page errors
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait for the store to finish loading (no more loading spinner)
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {
      // Loader might not exist if page loads very quickly
    });

    // Wait for router-view content to render
    // The router-view should contain either the dashboard or an error message
    await page.waitForSelector('.container-fluid', { timeout: 10000 }).catch(() => {
      console.log('Container fluid not found - app may not be fully initialized');
    });
  });

  test('should display the main navigation bar', async ({ page }) => {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e-results/navbar-main.png', fullPage: true });

    // Look for nav elements
    const nav = page.locator('nav.navbar');
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have NavCollapse component visible on desktop', async ({ page }) => {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e-results/navbar-collapse.png', fullPage: true });

    // Check for the nav_collapse div by id
    const navCollapse = page.locator('#nav_collapse');

    // Log whether it exists
    const count = await navCollapse.count();
    console.log('Number of #nav_collapse elements:', count);

    // Check if it's in the DOM
    expect(count).toBeGreaterThan(0);

    // Log classes
    const classes = await navCollapse.getAttribute('class');
    console.log('NavCollapse classes:', classes);

    // On desktop (lg+), the secondary navbar should be visible
    // The d-lg-flex class makes it visible on large screens
    await expect(navCollapse).toBeVisible({ timeout: 10000 });

    // Verify it contains navigation links
    const navLinks = navCollapse.locator('.nav-link');
    const linkCount = await navLinks.count();
    console.log('Number of navigation links:', linkCount);
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should have Nodes link in navbar', async ({ page }) => {
    // Debug: log all links on the page
    const allLinks = await page.locator('a').allTextContents();
    console.log('All links on page:', allLinks.slice(0, 20)); // First 20 links

    // Look for the Nodes link - it's inside the nav_collapse div
    const nodesLink = page.locator('#nav_collapse').getByRole('link', { name: /^Nodes$/i });

    // Check if it exists in DOM
    const count = await nodesLink.count();
    console.log('Number of Nodes links found:', count);

    if (count > 0) {
      // On desktop viewport, it should be visible
      await expect(nodesLink).toBeVisible({ timeout: 10000 });
    } else {
      throw new Error('Nodes link not found in #nav_collapse');
    }
  });

  test('should have Organizations link in navbar', async ({ page }) => {
    // Look for the Organizations link - it's inside the nav_collapse div
    const orgsLink = page.locator('#nav_collapse').getByRole('link', { name: /^Organizations$/i });

    // Check if it exists in DOM
    const count = await orgsLink.count();
    console.log('Number of Organizations links found:', count);

    if (count > 0) {
      // On desktop viewport, it should be visible
      await expect(orgsLink).toBeVisible({ timeout: 10000 });
    } else {
      throw new Error('Organizations link not found in #nav_collapse');
    }
  });

  test('should be able to click on Nodes link', async ({ page }) => {
    const nodesLink = page.locator('#nav_collapse').getByRole('link', { name: /^Nodes$/i });
    await expect(nodesLink).toBeVisible();
    await nodesLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on the nodes page (check URL contains 'nodes')
    await page.waitForURL(/.*nodes.*/);
    expect(page.url()).toContain('nodes');
  });

  test('should be able to click on Organizations link', async ({ page }) => {
    const orgsLink = page.locator('#nav_collapse').getByRole('link', { name: /^Organizations$/i });
    await expect(orgsLink).toBeVisible();
    await orgsLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify we're on the organizations page
    await page.waitForURL(/.*organizations.*/);
    expect(page.url()).toContain('organizations');
  });

  test('should display navbar even after navigation', async ({ page }) => {
    // Click on Nodes
    const nodesLink = page.locator('#nav_collapse').getByRole('link', { name: /^Nodes$/i });
    await expect(nodesLink).toBeVisible();
    await nodesLink.click();
    await page.waitForLoadState('networkidle');

    // Check navbar is still visible
    const nav = page.locator('nav.navbar');
    await expect(nav.first()).toBeVisible();

    // Check NavCollapse still has links
    const navCollapse = page.locator('#nav_collapse');
    await expect(navCollapse).toBeAttached();
  });

  test('should render main content on homepage', async ({ page }) => {
    // Take screenshot to debug what's actually rendering
    await page.screenshot({ path: 'e2e-results/homepage-content.png', fullPage: true });

    // Check if there's an error message
    const errorAlert = page.locator('.alert-danger');
    const hasError = await errorAlert.count() > 0;

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log('Error message found:', errorText);
    }

    // Check if router-view is rendering content
    const routerView = page.locator('.container-fluid');
    await expect(routerView).toBeVisible();

    // The app should either show the network dashboard or an error
    // If it's loading properly, we should see some content beyond just navbar and footer
    const bodyText = await page.textContent('body');
    console.log('Page body text length:', bodyText?.length);

    // Body should have more than just navbar/footer text
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});
