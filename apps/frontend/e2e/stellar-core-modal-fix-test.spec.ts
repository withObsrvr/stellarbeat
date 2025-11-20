import { test, expect } from '@playwright/test';

test.describe('Stellar Core Config Modal Fix', () => {
  test('should open Stellar core config modal when clicked', async ({ page }) => {
    // Capture console logs
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to a validator node
    await page.goto('http://localhost:5173/nodes/GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ?center=1&no-scroll=0&network=public');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for "Stellar core config" link in the sidebar
    const stellarCoreLink = page.getByText('Stellar core config').first();
    const isVisible = await stellarCoreLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      console.log('Stellar core config link not found - feature may be disabled');
      console.log('This is expected if enableConfigExport is false');
      test.skip();
      return;
    }

    console.log('Found Stellar core config link, clicking...');

    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-stellar-core-click.png', fullPage: true });

    // Click the link
    await stellarCoreLink.click();
    await page.waitForTimeout(1000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/after-stellar-core-click.png', fullPage: true });

    // Print relevant console logs
    const relevantLogs = consoleMessages.filter(msg =>
      msg.includes('[BModal]') || msg.includes('[VBModal]') || msg.includes('tomlExportModal')
    );
    console.log('=== Relevant Console Logs ===');
    relevantLogs.forEach(log => console.log(log));

    // Check if modal is visible
    const modal = page.locator('.modal.show').first();
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Modal visible:', modalVisible);

    if (!modalVisible) {
      // Check if modal exists but hidden
      const hiddenModal = page.locator('.modal').first();
      const exists = await hiddenModal.count() > 0;
      console.log('Modal exists in DOM:', exists);

      if (exists) {
        const classes = await hiddenModal.getAttribute('class');
        console.log('Modal classes:', classes);
      }

      // Print all console logs for debugging
      console.log('=== All Console Logs ===');
      consoleMessages.forEach(log => console.log(log));
    }

    // Assert modal is visible
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Assert modal has correct title
    const modalTitle = modal.locator('.modal-title');
    await expect(modalTitle).toContainText(/Stellar Core Config/i);

    // Check for TOML content
    const tomlContent = modal.locator('pre code');
    await expect(tomlContent).toBeVisible();

    console.log('✅ Modal opened successfully!');
  });
});
