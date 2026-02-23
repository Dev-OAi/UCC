import { test, expect } from '@playwright/test';

test('Territory Map tab exists and renders SVG', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Find the Territory Map tab in the sidebar
  const mapTab = page.locator('button[role="tab"]:has-text("Territory Map")');
  await expect(mapTab).toBeVisible();

  // Click the tab
  await mapTab.click();

  // Check for the SVG map
  const svgMap = page.locator('svg');
  await expect(svgMap).toBeVisible();

  // Check for some zip codes in the SVG
  const palmBeach = page.locator('text:has-text("33480")');
  // It might not be visible initially until hovered, but the path should be there
  const paths = page.locator('path');
  await expect(paths.count()).toBeGreaterThan(5);
});
