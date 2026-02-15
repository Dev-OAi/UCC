
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Click search box
        page.click('input[type="text"]')
        time.sleep(1)
        page.screenshot(path='dropdown_empty.png')

        # Type something
        page.fill('input[type="text"]', 'Checking')
        time.sleep(1)
        page.screenshot(path='dropdown_results.png')

        # Click a result
        page.click('button:has-text("All Access Checking")')
        time.sleep(2)
        page.screenshot(path='navigated_and_highlighted.png')

        # Check Products page doesn't have internal search
        page.screenshot(path='products_page_no_search.png')

        browser.close()

if __name__ == '__main__':
    run()
