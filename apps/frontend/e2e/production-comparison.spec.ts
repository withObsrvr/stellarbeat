import { test, expect } from '@playwright/test';

test.describe('Production vs Local Comparison', () => {
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

  test('compare production and local homepage', async ({ browser }) => {
    // Create two contexts - one for production, one for local
    const prodContext = await browser.newContext();
    const localContext = await browser.newContext();

    const prodPage = await prodContext.newPage();
    const localPage = await localContext.newPage();

    // Navigate both to homepage
    await prodPage.goto('https://radar.withobsrvr.com/');
    await localPage.goto('http://localhost:5173/');

    // Wait for both to load
    await prodPage.waitForLoadState('networkidle');
    await localPage.waitForLoadState('networkidle');

    // Wait for loaders to disappear
    await prodPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await localPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    // Take screenshots
    await prodPage.screenshot({ path: 'e2e-results/prod-homepage.png', fullPage: true });
    await localPage.screenshot({ path: 'e2e-results/local-homepage.png', fullPage: true });

    console.log('Production homepage screenshot saved to e2e-results/prod-homepage.png');
    console.log('Local homepage screenshot saved to e2e-results/local-homepage.png');

    // Get page titles
    const prodTitle = await prodPage.textContent('body');
    const localTitle = await localPage.textContent('body');

    console.log('Production page length:', prodTitle?.length);
    console.log('Local page length:', localTitle?.length);

    // Both should have substantial content
    expect(prodTitle?.length).toBeGreaterThan(100);
    expect(localTitle?.length).toBeGreaterThan(100);

    await prodContext.close();
    await localContext.close();
  });

  test('compare production and local nodes page', async ({ browser }) => {
    const prodContext = await browser.newContext();
    const localContext = await browser.newContext();

    const prodPage = await prodContext.newPage();
    const localPage = await localContext.newPage();

    // Navigate to nodes pages
    await prodPage.goto('https://radar.withobsrvr.com/nodes');
    await localPage.goto('http://localhost:5173/nodes');

    await prodPage.waitForLoadState('networkidle');
    await localPage.waitForLoadState('networkidle');

    await prodPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await localPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    await prodPage.waitForTimeout(2000);
    await localPage.waitForTimeout(2000);

    // Take screenshots
    await prodPage.screenshot({ path: 'e2e-results/prod-nodes.png', fullPage: true });
    await localPage.screenshot({ path: 'e2e-results/local-nodes.png', fullPage: true });

    console.log('Production nodes screenshot saved to e2e-results/prod-nodes.png');
    console.log('Local nodes screenshot saved to e2e-results/local-nodes.png');

    await prodContext.close();
    await localContext.close();
  });

  test('compare production and local organizations page', async ({ browser }) => {
    const prodContext = await browser.newContext();
    const localContext = await browser.newContext();

    const prodPage = await prodContext.newPage();
    const localPage = await localContext.newPage();

    // Navigate to organizations pages
    await prodPage.goto('https://radar.withobsrvr.com/organizations');
    await localPage.goto('http://localhost:5173/organizations');

    await prodPage.waitForLoadState('networkidle');
    await localPage.waitForLoadState('networkidle');

    await prodPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await localPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});

    await prodPage.waitForTimeout(2000);
    await localPage.waitForTimeout(2000);

    // Take screenshots
    await prodPage.screenshot({ path: 'e2e-results/prod-organizations.png', fullPage: true });
    await localPage.screenshot({ path: 'e2e-results/local-organizations.png', fullPage: true });

    console.log('Production organizations screenshot saved to e2e-results/prod-organizations.png');
    console.log('Local organizations screenshot saved to e2e-results/local-organizations.png');

    await prodContext.close();
    await localContext.close();
  });

  test('compare production and local node detail with trust graph', async ({ browser }) => {
    const prodContext = await browser.newContext();
    const localContext = await browser.newContext();

    const prodPage = await prodContext.newPage();
    const localPage = await localContext.newPage();

    // First get a node from local to ensure we're comparing the same node
    await localPage.goto('http://localhost:5173/nodes');
    await localPage.waitForLoadState('networkidle');
    await localPage.waitForSelector('.loader', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await localPage.waitForTimeout(2000);

    // Get the first node link
    const nodeLink = localPage.locator('a[href*="/nodes/"]').first();
    const href = await nodeLink.getAttribute('href');

    if (href) {
      // Extract just the path from href
      const nodePath = href.replace(/^https?:\/\/[^\/]+/, '');
      console.log('Comparing node:', nodePath);

      // Navigate both to the same node
      await prodPage.goto(`https://radar.withobsrvr.com${nodePath}`);
      await localPage.goto(`http://localhost:5173${nodePath}`);

      await prodPage.waitForLoadState('networkidle');
      await localPage.waitForLoadState('networkidle');

      // Give trust graph time to render
      await prodPage.waitForTimeout(3000);
      await localPage.waitForTimeout(3000);

      // Take screenshots
      await prodPage.screenshot({ path: 'e2e-results/prod-node-trust-graph.png', fullPage: true });
      await localPage.screenshot({ path: 'e2e-results/local-node-trust-graph.png', fullPage: true });

      console.log('Production node trust graph screenshot saved to e2e-results/prod-node-trust-graph.png');
      console.log('Local node trust graph screenshot saved to e2e-results/local-node-trust-graph.png');

      // Check for SVG elements in both
      const prodHasSvg = await prodPage.locator('svg').count() > 0;
      const localHasSvg = await localPage.locator('svg').count() > 0;

      console.log('Production has SVG:', prodHasSvg);
      console.log('Local has SVG:', localHasSvg);

      // Both should have SVG visualizations
      expect(prodHasSvg).toBeTruthy();
      expect(localHasSvg).toBeTruthy();
    }

    await prodContext.close();
    await localContext.close();
  });
});
