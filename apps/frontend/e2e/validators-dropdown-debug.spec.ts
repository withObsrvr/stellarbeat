import { test } from '@playwright/test';

test.describe('Validators Dropdown Debug', () => {
  test('debug validators dropdown click', async ({ page }) => {
    // Set up detailed console logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning' || msg.text().includes('validator') || msg.text().includes('expand')) {
        console.log(`[${type.toUpperCase()}]`, msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
      console.log('STACK:', error.stack);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find the validators title in the sidebar
    console.log('\n=== Looking for Validators element ===');

    // Try different selectors
    const validatorsText = await page.locator('text=Validators').count();
    console.log(`Found ${validatorsText} elements with text "Validators"`);

    // Look for the specific nav-link component
    const navLink = page.locator('.sb-nav-link:has-text("Validators")').first();
    const navLinkCount = await navLink.count();
    console.log(`Found ${navLinkCount} nav-link elements with "Validators"`);

    if (navLinkCount > 0) {
      const isVisible = await navLink.isVisible();
      console.log(`Nav-link visible: ${isVisible}`);

      const hasChevron = await navLink.locator('i[class*="chevron"]').count();
      console.log(`Has chevron icon: ${hasChevron > 0}`);

      // Check initial dropdown state
      const dropdownBefore = await page.locator('.sb-nav-dropdown').filter({ has: page.locator('text=SDF') }).count();
      console.log(`\nDropdown elements before click: ${dropdownBefore}`);

      // Check if showing state
      const showingBefore = await page.evaluate(() => {
        const dropdown = document.querySelector('.sb-nav-dropdown');
        if (dropdown) {
          const display = window.getComputedStyle(dropdown).display;
          return display !== 'none';
        }
        return false;
      });
      console.log(`Dropdown showing before click: ${showingBefore}`);

      console.log('\n=== Clicking on Validators ===');
      await navLink.click();
      await page.waitForTimeout(1000);

      // Check after click
      const showingAfter = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('.sb-nav-dropdown');
        console.log(`Total dropdowns found: ${dropdowns.length}`);
        for (let i = 0; i < dropdowns.length; i++) {
          const display = window.getComputedStyle(dropdowns[i]).display;
          console.log(`Dropdown ${i}: display = ${display}, innerHTML length = ${dropdowns[i].innerHTML.length}`);
        }
        const validatorsDropdown = Array.from(dropdowns).find(d => d.innerHTML.includes('SDF'));
        if (validatorsDropdown) {
          return window.getComputedStyle(validatorsDropdown).display !== 'none';
        }
        return false;
      });
      console.log(`\nDropdown showing after click: ${showingAfter}`);

      // Take screenshot
      await page.screenshot({ path: 'e2e-results/validators-dropdown-debug.png', fullPage: true });
    }
  });
});
