import { test } from '@playwright/test';

test.describe('Font Size Comparison', () => {
  test('compare font sizes between production and local', async ({ page }) => {
    // Check production first
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForSelector('text=available organizations', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const prodBodyFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });

    const prodH1FontSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? window.getComputedStyle(h1).fontSize : 'not found';
    });

    const prodTableFontSize = await page.evaluate(() => {
      const table = document.querySelector('table');
      return table ? window.getComputedStyle(table).fontSize : 'not found';
    });

    const prodButtonFontSize = await page.evaluate(() => {
      const button = document.querySelector('.btn');
      return button ? window.getComputedStyle(button).fontSize : 'not found';
    });

    console.log('=== PRODUCTION FONT SIZES ===');
    console.log(`Body: ${prodBodyFontSize}`);
    console.log(`H1: ${prodH1FontSize}`);
    console.log(`Table: ${prodTableFontSize}`);
    console.log(`Button: ${prodButtonFontSize}`);

    // Check local
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=available organizations', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const localBodyFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });

    const localH1FontSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? window.getComputedStyle(h1).fontSize : 'not found';
    });

    const localTableFontSize = await page.evaluate(() => {
      const table = document.querySelector('table');
      return table ? window.getComputedStyle(table).fontSize : 'not found';
    });

    const localButtonFontSize = await page.evaluate(() => {
      const button = document.querySelector('.btn');
      return button ? window.getComputedStyle(button).fontSize : 'not found';
    });

    console.log('\n=== LOCAL FONT SIZES ===');
    console.log(`Body: ${localBodyFontSize}`);
    console.log(`H1: ${localH1FontSize}`);
    console.log(`Table: ${localTableFontSize}`);
    console.log(`Button: ${localButtonFontSize}`);

    // Take screenshots for visual comparison
    await page.goto('https://radar.withobsrvr.com/');
    await page.waitForSelector('text=available organizations', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-results/production-font-size.png', fullPage: true });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=available organizations', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-results/local-font-size.png', fullPage: true });
  });
});
