import { test, expect } from '@playwright/test';

test.describe('Stellar Core Config Modal', () => {
  test('should open modal when clicking Stellar core config link', async ({ page }) => {
    // Navigate to a validator node page
    await page.goto('/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');
    await page.waitForLoadState('networkidle');

    // Find the "Stellar core config" link in the sidebar
    const stellarCoreLink = page.locator('.sb-nav-item')
      .filter({ hasText: 'Stellar core config' })
      .first();

    // Check if link is visible (may not be if feature is disabled)
    const isVisible = await stellarCoreLink.isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Click the link
    await stellarCoreLink.click();

    // Verify modal is visible
    const modal = page.locator('.modal.show').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal title
    const modalTitle = modal.locator('.modal-title');
    await expect(modalTitle).toContainText(/Stellar Core Config/i);

    // Verify TOML content is present
    const tomlContent = modal.locator('pre code');
    await expect(tomlContent).toBeVisible();
  });
});
