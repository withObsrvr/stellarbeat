import { test, expect } from '@playwright/test';

test.describe('Configuration modals tests', () => {
  test('should display Stellar core config modal when clicked', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('Navigating to node page...');
    await page.goto('http://localhost:5175/nodes/GBPLJDBFZO2H7QQH7YFCH3HFT6EMC42Z2DNJ2QFROCKETAPY54V4DCZD?center=1&no-scroll=0&network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Look for "Stellar core config" link in the sidebar
    const stellarCoreLink = page.locator('.side-bar').getByText('Stellar core config').first();
    const stellarCoreVisible = await stellarCoreLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Stellar core config link visible:', stellarCoreVisible);

    if (!stellarCoreVisible) {
      console.log('Stellar core config link not found - may not be available for this node');
      return;
    }

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-stellar-core-modal.png', fullPage: true });

    // Click the link
    console.log('Clicking Stellar core config link...');
    await stellarCoreLink.click();
    await page.waitForTimeout(1000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-stellar-core-modal.png', fullPage: true });

    // Check if modal is visible
    const modal = page.locator('.modal.show').first();
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Modal visible:', modalVisible);

    if (!modalVisible) {
      console.log('Modal is NOT visible!');

      // Check if modal exists but is hidden
      const hiddenModal = page.locator('.modal').first();
      const exists = await hiddenModal.count() > 0;
      console.log('Modal exists in DOM:', exists);

      if (exists) {
        const classes = await hiddenModal.getAttribute('class');
        console.log('Modal classes:', classes);
      }
    } else {
      // Check modal content
      const modalTitle = await modal.locator('.modal-title').textContent();
      console.log('Modal title:', modalTitle);

      const hasContent = await modal.locator('pre code').count() > 0;
      console.log('Has TOML content:', hasContent);
    }

    // Check for errors during the operation
    if (errors.length > 0) {
      console.log('ERRORS AFTER CLICK:');
      errors.forEach(err => console.log('  -', err));
    }

    // Assert modal is visible
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should display Radar configuration modal when clicked', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', err => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5175/?network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Look for "Radar configuration" link in the sidebar
    const radarConfigLink = page.locator('.side-bar').getByText('Radar configuration').first();
    const radarConfigVisible = await radarConfigLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Radar configuration link visible:', radarConfigVisible);

    if (!radarConfigVisible) {
      throw new Error('Radar configuration link not found in sidebar!');
    }

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-radar-config-modal.png', fullPage: true });

    // Click the link
    console.log('Clicking Radar configuration link...');
    await radarConfigLink.click();
    await page.waitForTimeout(1000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-radar-config-modal.png', fullPage: true });

    // Check if modal is visible
    const modal = page.locator('.modal.show').first();
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Modal visible:', modalVisible);

    if (!modalVisible) {
      console.log('Modal is NOT visible!');

      // Check if modal exists but is hidden
      const hiddenModal = page.locator('.modal').first();
      const exists = await hiddenModal.count() > 0;
      console.log('Modal exists in DOM:', exists);

      if (exists) {
        const classes = await hiddenModal.getAttribute('class');
        console.log('Modal classes:', classes);
      }
    } else {
      // Check modal content
      const modalTitle = await modal.locator('.modal-title').textContent();
      console.log('Modal title:', modalTitle);

      const hasTable = await modal.locator('table').count() > 0;
      console.log('Has configuration table:', hasTable);
    }

    // Check for errors during the operation
    if (errors.length > 0) {
      console.log('ERRORS AFTER CLICK:');
      errors.forEach(err => console.log('  -', err));
    }

    // Assert modal is visible
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});
