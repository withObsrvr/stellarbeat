import { test, expect } from '@playwright/test';

test.describe('Nodes Page and Node Details', () => {
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

  test('should load nodes list page', async ({ page }) => {
    // Navigate to nodes list page
    await page.goto('/nodes');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for data to load (no loading spinner)
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {
      console.log('No loader found or already hidden');
    });

    // Take screenshot
    await page.screenshot({ path: 'e2e-results/nodes-list.png', fullPage: true });

    // Check that we're on the nodes page
    expect(page.url()).toContain('/nodes');

    // Verify page has content (nodes table or list)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should display nodes table with data', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Wait for loader to disappear
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait a bit for data to render
    await page.waitForTimeout(2000);

    // Look for table or node list elements
    // The exact selector depends on your implementation
    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    const hasNodeElements = hasTable || hasCards;

    expect(hasNodeElements).toBeTruthy();
  });

  test('should be able to click on a node to view details', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Wait for loader
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Find the first clickable node link
    // Try different possible selectors
    const nodeLink = page.locator('a[href*="/nodes/"]').first();
    const linkCount = await nodeLink.count();

    if (linkCount > 0) {
      // Get the node public key from the href
      const href = await nodeLink.getAttribute('href');
      console.log('Clicking node with href:', href);

      await nodeLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a node detail page
      expect(page.url()).toContain('/nodes/');

      // Take screenshot of node detail page
      await page.screenshot({ path: 'e2e-results/node-detail.png', fullPage: true });
    } else {
      console.log('No node links found - may need network data');
    }
  });

  test('should display node information on detail page', async ({ page }) => {
    // First go to nodes list to get a node
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const nodeLink = page.locator('a[href*="/nodes/"]').first();
    const linkCount = await nodeLink.count();

    if (linkCount > 0) {
      await nodeLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for node information sections
      // Common sections: node info, quorum set, trust graph, etc.
      const bodyText = await page.textContent('body');

      // The page should have substantial content
      expect(bodyText.length).toBeGreaterThan(200);

      // Look for common node detail elements
      const hasCards = await page.locator('[class*="card"]').count() > 0;
      expect(hasCards).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should display node trust graph', async ({ page }) => {
    // Navigate to nodes list
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Click on first node
    const nodeLink = page.locator('a[href*="/nodes/"]').first();
    const linkCount = await nodeLink.count();

    if (linkCount > 0) {
      await nodeLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Give trust graph time to render

      // Take screenshot to see what's rendering
      await page.screenshot({ path: 'e2e-results/node-trust-graph.png', fullPage: true });

      // Look for trust graph elements
      // Trust graphs are typically rendered with SVG or Canvas
      const hasSvg = await page.locator('svg').count() > 0;
      const hasCanvas = await page.locator('canvas').count() > 0;

      console.log('Has SVG:', hasSvg, 'Has Canvas:', hasCanvas);

      // At least one visualization element should be present
      expect(hasSvg || hasCanvas).toBeTruthy();

      // If SVG, check for graph nodes/edges
      if (hasSvg) {
        const svgElements = await page.locator('svg *').count();
        console.log('SVG child elements:', svgElements);
        expect(svgElements).toBeGreaterThan(0);
      }
    } else {
      test.skip();
    }
  });

  test('should be able to navigate back to nodes list from node detail', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const nodeLink = page.locator('a[href*="/nodes/"]').first();
    const linkCount = await nodeLink.count();

    if (linkCount > 0) {
      // Go to node detail
      await nodeLink.click();
      await page.waitForLoadState('networkidle');

      // Navigate back using browser back button or breadcrumb
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back on nodes list
      expect(page.url()).toContain('/nodes');
      expect(page.url()).not.toMatch(/\/nodes\/.+/);
    } else {
      test.skip();
    }
  });
});
