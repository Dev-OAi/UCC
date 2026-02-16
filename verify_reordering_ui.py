from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            # Go to the app
            page.goto('http://localhost:5173', timeout=60000)

            # Click on 3. UCC tab
            page.click('role=tab[name="3. UCC"]')
            time.sleep(2)

            # Click on Columns button to open the dropdown
            page.click('button:has-text("Columns")')
            time.sleep(1)

            # Hover over a column item to see if buttons appear (though they might be always visible now)
            # Take a screenshot of the open dropdown
            page.screenshot(path='ucc_column_toggle_open.png')
            print("Screenshot saved to ucc_column_toggle_open.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path='error_reordering_ui.png')
        finally:
            browser.close()

if __name__ == "__main__":
    run()
