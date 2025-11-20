import { test, expect } from '@playwright/test';

test.describe('Modify Network Modal Comparison', () => {
  test('Compare local vs production modify network modal', async ({ page }) => {
    console.log('\n=== Testing LOCAL modify network modal ===');

    // Navigate to local network dashboard
    await page.goto('http://localhost:5175/?view=graph&network=public&no-scroll=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "Modify Network" link in sidebar
    const modifyNetworkLink = page.locator('.side-bar').getByText('Modify Network');
    await expect(modifyNetworkLink).toBeVisible({ timeout: 10000 });
    await modifyNetworkLink.click();
    await page.waitForTimeout(2000); // Give more time for modal animation

    // Check modal visibility - try multiple selectors
    let modal = page.locator('.modal.show');
    let modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (!modalVisible) {
      // Try alternate selector
      modal = page.locator('.modal-dialog');
      modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    }

    console.log('Local modal visible:', modalVisible);

    if (modalVisible) {
      // Get modal properties
      const modalDialog = modal.locator('.modal-dialog');
      const modalSize = await modalDialog.getAttribute('class');
      console.log('Local modal dialog classes:', modalSize);

      // Check if textarea exists
      const textarea = modal.locator('#textarea');
      const textareaExists = await textarea.count() > 0;
      console.log('Local textarea exists:', textareaExists);

      if (textareaExists) {
        const rows = await textarea.getAttribute('rows');
        const placeholder = await textarea.getAttribute('placeholder');
        console.log('Local textarea rows:', rows);
        console.log('Local textarea placeholder:', placeholder);
      }

      // Check for schema links
      const schemaLinks = modal.locator('a[href*="schema"]');
      const schemaLinksCount = await schemaLinks.count();
      console.log('Local schema links count:', schemaLinksCount);

      for (let i = 0; i < schemaLinksCount; i++) {
        const linkText = await schemaLinks.nth(i).textContent();
        const linkHref = await schemaLinks.nth(i).getAttribute('href');
        console.log(`Local schema link ${i + 1}:`, linkText, '->', linkHref);
      }

      // Check modal header
      const modalHeader = modal.locator('.modal-header');
      const headerExists = await modalHeader.count() > 0;
      console.log('Local modal header exists:', headerExists);

      if (headerExists) {
        const headerText = await modalHeader.textContent();
        console.log('Local modal header text:', headerText?.trim());
      }

      // Check modal body structure
      const modalBody = modal.locator('.modal-body');
      const bodyHtml = await modalBody.innerHTML();
      console.log('Local modal body structure (first 500 chars):', bodyHtml.substring(0, 500));

      // Check buttons
      const buttons = modal.locator('button');
      const buttonCount = await buttons.count();
      console.log('Local button count:', buttonCount);

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await buttons.nth(i).textContent();
        console.log(`Local button ${i + 1}:`, buttonText?.trim());
      }

      // Take a full page screenshot of local modal
      await page.screenshot({ path: 'test-results/local-modify-network-modal.png', fullPage: true });
      console.log('Local modal screenshot saved to test-results/local-modify-network-modal.png');
    } else {
      console.log('Local modal not detected - taking full page screenshot for debugging');
      await page.screenshot({ path: 'test-results/local-modify-network-modal-not-found.png', fullPage: true });
    }

    console.log('\n=== Testing PRODUCTION modify network modal ===');

    // Open production in new page
    const prodPage = await page.context().newPage();
    await prodPage.goto('https://radar.withobsrvr.com/?view=graph&network=public&no-scroll=1');
    await prodPage.waitForLoadState('networkidle');
    await prodPage.waitForTimeout(2000);

    // Click "Modify Network" link in production sidebar
    const prodModifyNetworkLink = prodPage.locator('.side-bar').getByText('Modify Network');
    const prodLinkVisible = await prodModifyNetworkLink.isVisible({ timeout: 10000 }).catch(() => false);

    if (prodLinkVisible) {
      await prodModifyNetworkLink.click();
      await prodPage.waitForTimeout(1000);

      // Check modal visibility - find by modal title
      const prodModal = prodPage.locator('.modal').filter({ hasText: 'Modify the network' });
      const prodModalVisible = await prodModal.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Production modal visible:', prodModalVisible);

      if (prodModalVisible) {
        // Get modal properties
        const prodModalDialog = prodModal.locator('.modal-dialog');
        const prodModalSize = await prodModalDialog.getAttribute('class');
        console.log('Production modal dialog classes:', prodModalSize);

        // Check if textarea exists
        const prodTextarea = prodModal.locator('#textarea');
        const prodTextareaExists = await prodTextarea.count() > 0;
        console.log('Production textarea exists:', prodTextareaExists);

        if (prodTextareaExists) {
          const prodRows = await prodTextarea.getAttribute('rows');
          const prodPlaceholder = await prodTextarea.getAttribute('placeholder');
          console.log('Production textarea rows:', prodRows);
          console.log('Production textarea placeholder:', prodPlaceholder);
        }

        // Check for schema links
        const prodSchemaLinks = prodModal.locator('a[href*="schema"]');
        const prodSchemaLinksCount = await prodSchemaLinks.count();
        console.log('Production schema links count:', prodSchemaLinksCount);

        for (let i = 0; i < prodSchemaLinksCount; i++) {
          const linkText = await prodSchemaLinks.nth(i).textContent();
          const linkHref = await prodSchemaLinks.nth(i).getAttribute('href');
          console.log(`Production schema link ${i + 1}:`, linkText, '->', linkHref);
        }

        // Check modal header
        const prodModalHeader = prodModal.locator('.modal-header');
        const prodHeaderExists = await prodModalHeader.count() > 0;
        console.log('Production modal header exists:', prodHeaderExists);

        if (prodHeaderExists) {
          const prodHeaderText = await prodModalHeader.textContent();
          console.log('Production modal header text:', prodHeaderText?.trim());
        }

        // Check modal body structure
        const prodModalBody = prodModal.locator('.modal-body');
        const prodBodyHtml = await prodModalBody.innerHTML();
        console.log('Production modal body structure (first 500 chars):', prodBodyHtml.substring(0, 500));

        // Check buttons
        const prodButtons = prodModal.locator('button');
        const prodButtonCount = await prodButtons.count();
        console.log('Production button count:', prodButtonCount);

        for (let i = 0; i < Math.min(prodButtonCount, 10); i++) {
          const buttonText = await prodButtons.nth(i).textContent();
          console.log(`Production button ${i + 1}:`, buttonText?.trim());
        }

        // Take a full page screenshot of production modal
        await prodPage.screenshot({ path: 'test-results/production-modify-network-modal.png', fullPage: true });
        console.log('Production modal screenshot saved to test-results/production-modify-network-modal.png');
      } else {
        console.log('Production modal did not appear');
      }
    } else {
      console.log('Production "Modify network" link not found');
    }

    await prodPage.close();

    console.log('\n=== Comparison Summary ===');
    console.log('Review the screenshots in test-results/ to see visual differences');
    console.log('- test-results/local-modify-network-modal.png');
    console.log('- test-results/production-modify-network-modal.png');
    console.log('Compare the console output above for structural differences');
  });
});
