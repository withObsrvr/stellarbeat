import { test, expect } from '@playwright/test';

test.describe('Dropdown Detailed Debug', () => {
  test('check validators dropdown state changes', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      console.log(`BROWSER: ${msg.text()}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Inject debugging code into the page
    const debugInfo = await page.evaluate(() => {
      // Find the validators dropdown element
      const validatorsLinks = Array.from(document.querySelectorAll('.sb-nav-link'));
      const validatorsLink = validatorsLinks.find(el => el.textContent?.includes('Validators'));

      if (!validatorsLink) {
        return { error: 'Could not find Validators link' };
      }

      // Get the dropdown element
      const parentItem = validatorsLink.closest('.sb-nav-item');
      const dropdown = parentItem?.querySelector('.sb-nav-dropdown');

      return {
        validatorsLinkFound: !!validatorsLink,
        parentItemFound: !!parentItem,
        dropdownFound: !!dropdown,
        dropdownDisplay: dropdown ? window.getComputedStyle(dropdown).display : 'N/A',
        dropdownInnerHTML: dropdown ? dropdown.innerHTML.substring(0, 100) : 'N/A',
        vShowAttribute: dropdown?.hasAttribute('v-show'),
        allAttributes: dropdown ? Array.from(dropdown.attributes).map(attr => `${attr.name}=${attr.value}`) : []
      };
    });

    console.log('Before click:', JSON.stringify(debugInfo, null, 2));

    // Click the validators link
    const validatorsLink = page.locator('.sb-nav-link:has-text("Validators")').first();
    await validatorsLink.click();
    await page.waitForTimeout(500);

    // Check after click
    const debugInfoAfter = await page.evaluate(() => {
      const validatorsLinks = Array.from(document.querySelectorAll('.sb-nav-link'));
      const validatorsLink = validatorsLinks.find(el => el.textContent?.includes('Validators'));
      const parentItem = validatorsLink?.closest('.sb-nav-item');
      const dropdown = parentItem?.querySelector('.sb-nav-dropdown');

      return {
        dropdownDisplay: dropdown ? window.getComputedStyle(dropdown).display : 'N/A',
        dropdownVisible: dropdown ? window.getComputedStyle(dropdown).display !== 'none' : false,
        dropdownChildCount: dropdown?.children.length || 0,
      };
    });

    console.log('After click:', JSON.stringify(debugInfoAfter, null, 2));

    await page.screenshot({ path: 'e2e-results/dropdown-detailed-debug.png', fullPage: true });
  });
});
