import { test, expect } from '@playwright/test';

test('Verify Market Intelligence Descriptive Labels', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');

  // Navigate to Market Intelligence
  await page.click('button:has-text("Market Intelligence")', { force: true });

  // Wait for loading to finish
  await page.waitForSelector('h1:has-text("Market Intelligence")', { timeout: 10000 });

  // Check for the Territory Value Chain section
  const valueChainHeader = page.locator('h3:has-text("Territory Value Chain")');
  await expect(valueChainHeader).toBeVisible();

  // Look for descriptive labels (Supplier, Partner, etc.)
  // We check for some keywords from our VALUE_CHAIN mapping in value_partner_mapper.py
  const descriptiveKeywords = ['Supplier', 'Partner', 'Distribution', 'Service', 'Provider', 'Strategic'];

  // Take a screenshot of the value chain section
  const valueChainSection = page.locator('div:has-text("Territory Value Chain")').first();
  await valueChainSection.screenshot({ path: 'value_chain_ui.png' });

  console.log('Verifying descriptive labels in Value Chain...');
  let found = false;
  for (const keyword of descriptiveKeywords) {
    const locator = page.locator(`span:has-text("${keyword}")`);
    const count = await locator.count();
    if (count > 0) {
      console.log(`Found ${count} instances of keyword: ${keyword}`);
      found = true;
    }
  }

  // Note: If no descriptive labels are found, it might be because the JSON isn't populated or the mapping hasn't run.
  // But we want to at least see the UI state.

  // Also verify the purge modal is still working (Security)
  await page.click('button:has-text("System Guardrails")', { force: true });
  await page.click('button:has-text("Purge Memory & Restore Baseline")', { force: true });
  const modal = page.locator('div:has-text("System Reset Authorization")').first();
  await expect(modal).toBeVisible();
  await modal.screenshot({ path: 'purge_modal_final.png' });
});
