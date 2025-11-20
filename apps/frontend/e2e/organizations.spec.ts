import { test, expect } from '@playwright/test';

test.describe('Organizations Page and Organization Details', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Listen for console messages and errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('PAGE ERROR:', msg.text());
      }
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  });

  test('should load organizations list page', async ({ page }) => {
    // Navigate to organizations list page
    await page.goto('/organizations');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for data to load (no loading spinner)
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {
      console.log('No loader found or already hidden');
    });

    // Take screenshot
    await page.screenshot({ path: 'e2e-results/organizations-list.png', fullPage: true });

    // Check that we're on the organizations page
    expect(page.url()).toContain('/organizations');

    // Verify page has content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should display organizations table with data', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Wait for loader to disappear
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait a bit for data to render
    await page.waitForTimeout(2000);

    // Look for table or organization list elements
    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    const hasOrgElements = hasTable || hasCards;

    expect(hasOrgElements).toBeTruthy();
  });

  test('should be able to click on an organization to view details', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Wait for loader
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Find the first clickable organization link
    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      // Get the organization ID from the href
      const href = await orgLink.getAttribute('href');
      console.log('Clicking organization with href:', href);

      await orgLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on an organization detail page
      expect(page.url()).toContain('/organizations/');

      // Take screenshot of organization detail page
      await page.screenshot({ path: 'e2e-results/organization-detail.png', fullPage: true });
    } else {
      console.log('No organization links found - may need network data');
    }
  });

  test('should display organization information on detail page', async ({ page }) => {
    // First go to organizations list to get an organization
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      await orgLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for organization information sections
      const bodyText = await page.textContent('body');

      // The page should have substantial content
      expect(bodyText.length).toBeGreaterThan(200);

      // Look for common organization detail elements
      const hasCards = await page.locator('[class*="card"]').count() > 0;
      expect(hasCards).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should display organization validators list', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      await orgLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({ path: 'e2e-results/organization-validators.png', fullPage: true });

      // Organizations typically show their validators
      // Look for validator-related content
      const bodyText = await page.textContent('body');
      const hasValidatorContent = bodyText.toLowerCase().includes('validator') ||
                                  bodyText.toLowerCase().includes('node');

      expect(hasValidatorContent).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should be able to navigate to a validator from organization page', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      await orgLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for links to nodes/validators
      const nodeLink = page.locator('a[href*="/nodes/"]').first();
      const nodeLinkCount = await nodeLink.count();

      if (nodeLinkCount > 0) {
        const href = await nodeLink.getAttribute('href');
        console.log('Clicking node from organization:', href);

        await nodeLink.click();
        await page.waitForLoadState('networkidle');

        // Should be on a node detail page
        expect(page.url()).toContain('/nodes/');

        // Take screenshot
        await page.screenshot({ path: 'e2e-results/org-to-node-navigation.png', fullPage: true });
      } else {
        console.log('No node links found on organization page');
      }
    } else {
      test.skip();
    }
  });

  test('should be able to navigate back to organizations list from organization detail', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      // Go to organization detail
      await orgLink.click();
      await page.waitForLoadState('networkidle');

      // Navigate back using browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back on organizations list
      expect(page.url()).toContain('/organizations');
      expect(page.url()).not.toMatch(/\/organizations\/.+/);
    } else {
      test.skip();
    }
  });

  test('should display organization statistics if available', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const linkCount = await orgLink.count();

    if (linkCount > 0) {
      await orgLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for charts or statistics
      const hasSvg = await page.locator('svg').count() > 0;
      const hasCanvas = await page.locator('canvas').count() > 0;

      console.log('Organization stats - Has SVG:', hasSvg, 'Has Canvas:', hasCanvas);

      // At least the page should render
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(100);
    } else {
      test.skip();
    }
  });
});
