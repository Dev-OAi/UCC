const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForSelector('text=records found', { timeout: 30000 });
  const downloadButton = page.locator('button[aria-label="Download CSV"]');
  await downloadButton.click();
  await page.waitForTimeout(1000); // Wait for animation
  await page.screenshot({ path: 'download_modal_check.png' });
  await browser.close();
})();
