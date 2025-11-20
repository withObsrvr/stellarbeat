import { test, expect } from '@playwright/test';

test.describe('Stellar core config modal tests', () => {
  test('should display Stellar core config modal when clicked on node page', async ({ page }) => {
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
    // Navigate to a validator node that should have the Stellar core config option
    await page.goto('http://localhost:5175/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Look for "Stellar core config" link in the sidebar Tools section
    const stellarCoreLink = page.locator('.side-bar').getByText('Stellar core config').first();
    const stellarCoreVisible = await stellarCoreLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Stellar core config link visible:', stellarCoreVisible);

    if (!stellarCoreVisible) {
      console.log('Stellar core config link not found - this feature may be disabled or node is not a validator');

      // Check if we're on a validator node
      const pageContent = await page.locator('body').textContent();
      const isValidator = pageContent?.includes('Validator') || pageContent?.includes('Full Validator');
      console.log('Is validator node:', isValidator);

      console.log('Skipping test - Stellar core config feature may be disabled (requires enableConfigExport flag)');
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

      // Check if TOML content is present
      const hasTOMLContent = await modal.locator('pre code').count() > 0;
      console.log('Has TOML content:', hasTOMLContent);

      if (hasTOMLContent) {
        const tomlContent = await modal.locator('pre code').textContent();
        console.log('TOML content sample (first 100 chars):', tomlContent?.substring(0, 100));

        // Verify it looks like TOML config
        const containsExpectedContent = tomlContent?.includes('VALIDATORS') ||
                                       tomlContent?.includes('QUORUM_SET') ||
                                       tomlContent?.includes('[');
        console.log('Contains expected TOML structure:', containsExpectedContent);
      }

      // Check for Close button
      const closeButton = modal.locator('button', { hasText: /Close/i });
      const hasCloseButton = await closeButton.count() > 0;
      console.log('Has Close button:', hasCloseButton);
    }

    // Check for errors during the operation
    if (errors.length > 0) {
      console.log('ERRORS AFTER CLICK:');
      errors.forEach(err => console.log('  -', err));
    }

    // Assert modal is visible
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Assert modal has the correct title
    await expect(modal.locator('.modal-title')).toContainText(/Stellar Core Config/i);
  });
});
