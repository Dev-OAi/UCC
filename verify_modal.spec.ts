import { test, expect } from '@playwright/test';

test('clicking download button opens security modal', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Wait for data to load (loading spinner should disappear)
  await page.waitForSelector('text=records found', { timeout: 30000 });

  // Find the Download CSV button and click it
  const downloadButton = page.locator('button[aria-label="Download CSV"]');
  await downloadButton.click();

  // Check if the security modal is visible
  const modalHeader = page.locator('text=Secure Data Export');
  await expect(modalHeader).toBeVisible();

  // Check if the passcode input is visible
  const input = page.locator('input[placeholder="ENTER PASSCODE"]');
  await expect(input).toBeVisible();
});
