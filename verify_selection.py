
import time
from playwright.sync_api import sync_playwright

def verify_row_selection_tablet():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Test Tablet (768x1024)
        print("Testing Row Selection on Tablet...")
        page = browser.new_page(viewport={'width': 768, 'height': 1024})
        page.goto('http://localhost:5173')
        time.sleep(2) # Wait for initial load

        # Open sidebar
        page.click('[aria-label="Toggle left sidebar"]')
        time.sleep(0.5)

        # Navigate to a category to see the table
        # Find the category button in the sidebar.
        # Since 'SB' might be in multiple places, let's be specific or use the dashboard.
        # Actually, clicking the card on dashboard is easier.
        page.click('[aria-label="Toggle left sidebar"]') # close it back
        time.sleep(0.5)

        # Dashboard cards usually have the category name
        page.click('h3:has-text("SB")')
        time.sleep(2)

        # Check if table is visible and right sidebar is hidden
        sidebar_right = page.locator('aside').nth(1)
        # Note: it might be 1px due to border if not handled, but I handled border-none
        assert sidebar_right.bounding_box()['width'] == 0
        print("Initial state: Right sidebar is hidden")

        # Click a row in the table
        page.locator('.virtual-table-row').first.click()
        time.sleep(1)

        # Right sidebar should now be open
        assert sidebar_right.bounding_box()['width'] == 320
        print("After selection: Right sidebar is open")

        page.screenshot(path='tablet_row_selected.png')

        browser.close()

if __name__ == "__main__":
    verify_row_selection_tablet()
