import { test, expect } from '@playwright/test';

test('Verify Recursive Learning UI and Security Modal', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');

  // 1. Check Market Intelligence
  console.log('Navigating to Market Intelligence...');
  await page.click('button:has-text("Market Intelligence")', { force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'market_intelligence.png' });

  const valueChain = page.locator('h3:has-text("Territory Value Chain")');
  if (await valueChain.isVisible()) {
    console.log('Value Chain visible, checking for descriptive labels...');
    // In our Market_Graph.json: "Distribution Point", "Branding Partner"
    const partnerText = page.locator('span:has-text("Partner")').first();
    const distributionText = page.locator('span:has-text("Distribution")').first();

    if (await partnerText.isVisible()) console.log('Found Partner label');
    if (await distributionText.isVisible()) console.log('Found Distribution label');
  }

  // 2. Check System Guardrails and Purge Modal
  console.log('Navigating to System Guardrails...');
  await page.click('button:has-text("System Guardrails")', { force: true });
  await page.waitForTimeout(1000);

  console.log('Opening Purge Modal...');
  await page.click('button:has-text("Purge Memory & Restore Baseline")', { force: true });
  await page.waitForSelector('h3:has-text("System Reset Authorization")');
  await page.screenshot({ path: 'purge_modal_red.png' });

  const modal = page.locator('div:has-text("System Reset Authorization")').first();
  await expect(modal).toBeVisible();

  // Verify red button in modal - Button text is "Authorize Reset" in SystemGuardrails.tsx
  const authorizeBtn = modal.locator('button:has-text("Authorize Reset")');
  await expect(authorizeBtn).toBeVisible();

  console.log('UI Verification Complete.');
});
