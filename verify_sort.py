import asyncio
from playwright.async_api import async_playwright
import os

async def verify_sorting():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:5175")

        print("Waiting for data load...")
        await asyncio.sleep(10)

        # Navigate to All hub
        all_hub = page.locator("button:has-text('All Hub')")
        await all_hub.click()
        await asyncio.sleep(2)

        # Check sort icon in Date Filed column
        header = page.locator("th:has-text('Date Filed')")
        # The filter button inside the th header should have the blue styling when sorted
        sorted_btn = header.locator("button.text-blue-600")
        is_sorted = await sorted_btn.is_visible()
        print(f"Date Filed column sorted indicator visible: {is_sorted}")

        # Take screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        await page.screenshot(path="/home/jules/verification/all_hub_sort.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_sorting())
