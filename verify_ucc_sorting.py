from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            page.goto('http://localhost:5173', timeout=60000)
            page.click('role=tab[name="3. UCC"]')
            time.sleep(2)

            # Open columns dropdown and uncheck Industry, Category, Page-Ref to see others
            page.click('button:has-text("Columns")')
            page.click('label:has-text("Industry")')
            page.click('label:has-text("Category")')
            page.click('label:has-text("Page-Ref")')
            # Close dropdown by clicking elsewhere
            page.click('h2:has-text("3. UCC Hub")')

            time.sleep(1)
            page.screenshot(path='ucc_hub_after_hide.png')

            # Click on Filing Date to sort
            page.click('th:has-text("Filing Date")')
            time.sleep(1)
            page.screenshot(path='ucc_hub_sorted_date_asc.png')

            # Click again for desc
            page.click('th:has-text("Filing Date")')
            time.sleep(1)
            page.screenshot(path='ucc_hub_sorted_date_desc.png')

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
