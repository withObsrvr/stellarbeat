import { test, expect } from '@playwright/test';

test.describe('Quorum slices modal tests', () => {
  test('should display Quorum slices modal when clicked on node page', async ({ page }) => {
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
    // Navigate to a validator node
    await page.goto('http://localhost:5175/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors
    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    // Look for "Quorum slices" link in the sidebar Tools section
    const quorumSlicesLink = page.locator('.side-bar').getByText('Quorum slices').first();
    const quorumSlicesVisible = await quorumSlicesLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Quorum slices link visible:', quorumSlicesVisible);

    if (!quorumSlicesVisible) {
      console.log('Quorum slices link not found - this node may not be a validator');

      // Check if we're on a validator node
      const pageContent = await page.locator('body').textContent();
      const isValidator = pageContent?.includes('Validator') || pageContent?.includes('Full Validator');
      console.log('Is validator node:', isValidator);

      if (!isValidator) {
        console.log('Skipping test - not a validator node');
        return;
      }

      throw new Error('Quorum slices link should be visible for validator nodes');
    }

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-quorum-slices-modal.png', fullPage: true });

    // Click the link
    console.log('Clicking Quorum slices link...');
    await quorumSlicesLink.click();
    await page.waitForTimeout(1000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-quorum-slices-modal.png', fullPage: true });

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

        const modalId = await hiddenModal.getAttribute('id');
        console.log('Modal ID:', modalId);
      }
    } else {
      // Check modal content - quorum slices modal doesn't have a title, just a body
      const modalBody = modal.locator('.modal-body');
      const bodyVisible = await modalBody.isVisible().catch(() => false);
      console.log('Modal body visible:', bodyVisible);

      if (bodyVisible) {
        // Check for the info alert about node being added to every slice
        const hasAlert = await modalBody.locator('.alert-info').count() > 0;
        console.log('Has info alert:', hasAlert);

        if (hasAlert) {
          const alertText = await modalBody.locator('.alert-info').textContent();
          console.log('Alert text:', alertText);
        }

        // Count any tables that contain quorum slice information
        const tableCount = await modalBody.locator('table').count();
        console.log('Tables in modal:', tableCount);

        if (tableCount > 0) {
          // Get a sample of table content
          const tableRows = await modalBody.locator('table tbody tr').count();
          console.log('Table rows:', tableRows);
        }

        // Check for pagination (indicates the slices list)
        const hasPagination = await modalBody.locator('.pagination').count() > 0;
        console.log('Has pagination:', hasPagination);
      }
    }

    // Check for errors during the operation
    if (errors.length > 0) {
      console.log('ERRORS AFTER CLICK:');
      errors.forEach(err => console.log('  -', err));
    }

    // Assert modal is visible
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Assert modal has body with table
    const modalBody = modal.locator('.modal-body');
    await expect(modalBody).toBeVisible({ timeout: 5000 });

    const hasTable = await modalBody.locator('table').count() > 0;
    console.log('Modal has table:', hasTable);

    expect(hasTable).toBeTruthy();
  });
});
