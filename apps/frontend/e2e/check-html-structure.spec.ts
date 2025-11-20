import { test } from '@playwright/test';

test.describe('HTML Structure Check', () => {
  test('check validators dropdown HTML structure', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Network transitive quorumset', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const htmlStructure = await page.evaluate(() => {
      const validatorsLinks = Array.from(document.querySelectorAll('.sb-nav-link'));
      const validatorsLink = validatorsLinks.find(el => el.textContent?.includes('Validators'));

      if (!validatorsLink) return { error: 'Validators link not found' };

      // Get all parent elements
      let current = validatorsLink;
      const parents = [];
      while (current && current !== document.body) {
        parents.push({
          tag: current.tagName,
          classList: Array.from(current.classList),
          hasClickListener: current.onclick !== null,
        });
        current = current.parentElement;
      }

      // Get the outer HTML of the immediate sb-nav-item parent
      const navItem = validatorsLink.closest('.sb-nav-item');

      return {
        parents,
        navItemHTML: navItem?.outerHTML.substring(0, 500)
      };
    });

    console.log('HTML Structure:', JSON.stringify(htmlStructure, null, 2));
  });
});
