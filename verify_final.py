from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Go to Scorecard
        page.click("button[role='tab']:has-text('Scorecard')")
        time.sleep(2)

        # Take screenshot of the header area with export buttons
        page.screenshot(path="final_scorecard_buttons.png")

        # Check if PDF Report button exists
        pdf_btn = page.query_selector("button:has-text('PDF Report')")
        print(f"PDF Button found: {pdf_btn is not None}")

        browser.close()

if __name__ == "__main__":
    verify()
