from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Go to SB hub and add a lead
        page.click("button[role='tab']:has-text('1. SB')")
        time.sleep(2)
        # Click a row to open right sidebar
        page.click("tr:has-text('INC')")
        time.sleep(1)
        # Click "Add to Scorecard Pipeline"
        page.click("button:has-text('Add to Scorecard Pipeline')")
        time.sleep(1)

        # Go to Scorecard
        page.click("button[role='tab']:has-text('Scorecard')")
        time.sleep(1)

        # Hover over the lead row to reveal actions
        page.hover("tr:has-text('INC')")
        page.screenshot(path="scorecard_actions_hover.png")

        # Check if Edit and Delete buttons exist
        edit_btn = page.query_selector("button[title='Edit Business']")
        trash_btn = page.query_selector("button[title='Delete Lead']")
        print(f"Edit Button found: {edit_btn is not None}")
        print(f"Trash Button found: {trash_btn is not None}")

        browser.close()

if __name__ == "__main__":
    verify()
