import { test, expect } from '@playwright/test';

test.describe('Modal screenshot test', () => {
  test('take screenshot of modify network modal', async ({ page }) => {
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');

    // Wait for the page to be fully loaded
    await page.waitForSelector('.navbar', { timeout: 10000 });

    console.log('Looking for modify network link...');

    // Find and click the "Modify network" link in the sidebar
    const modifyNetworkLink = page.locator('text=Modify network').first();
    await expect(modifyNetworkLink).toBeVisible({ timeout: 10000 });

    console.log('Clicking modify network link...');
    await modifyNetworkLink.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'modal-screenshot.png', fullPage: true });
    console.log('Screenshot saved to modal-screenshot.png');

    // Check the computed z-index of the modal
    const modal = page.locator('.modal.fade.show').first();
    const modalZIndex = await modal.evaluate(el => window.getComputedStyle(el).zIndex);
    console.log('Modal z-index:', modalZIndex);

    const backdrop = page.locator('.modal-backdrop').first();
    const backdropZIndex = await backdrop.evaluate(el => window.getComputedStyle(el).zIndex);
    console.log('Backdrop z-index:', backdropZIndex);

    // Check trust graph z-index
    const trustGraph = page.locator('[class*="trust-graph"], canvas, svg').first();
    if (await trustGraph.isVisible().catch(() => false)) {
      const trustGraphZIndex = await trustGraph.evaluate(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        const position = window.getComputedStyle(el).position;
        return { zIndex, position };
      });
      console.log('Trust graph z-index and position:', trustGraphZIndex);
    }

    // Check if modal is actually visible
    const modalVisible = await modal.isVisible();
    console.log('Modal visible:', modalVisible);

    // Get all elements and their z-index
    const allElements = await page.evaluate(() => {
      const elements: Array<{ tag: string; class: string; zIndex: string; position: string }> = [];
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        const zIndex = styles.zIndex;
        const position = styles.position;
        if (zIndex !== 'auto' || position !== 'static') {
          elements.push({
            tag: el.tagName,
            class: el.className.toString().substring(0, 50),
            zIndex,
            position
          });
        }
      });
      return elements.sort((a, b) => {
        const aZ = a.zIndex === 'auto' ? 0 : parseInt(a.zIndex);
        const bZ = b.zIndex === 'auto' ? 0 : parseInt(b.zIndex);
        return bZ - aZ;
      }).slice(0, 20);
    });

    console.log('Top 20 elements by z-index:', JSON.stringify(allElements, null, 2));
  });
});
