
import time
from playwright.sync_api import sync_playwright

def verify_responsive_sidebars():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Test Desktop
        print("Testing Desktop view...")
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto('http://localhost:5173')
        time.sleep(2) # Wait for initial load

        # Check if sidebars are visible
        sidebar_left = page.locator('aside').nth(0)
        sidebar_right = page.locator('aside').nth(1)

        assert sidebar_left.is_visible()
        assert sidebar_right.is_visible()

        left_width = sidebar_left.bounding_box()['width']
        right_width = sidebar_right.bounding_box()['width']
        print(f"Desktop - Left sidebar width: {left_width}, Right sidebar width: {right_width}")
        assert left_width == 256
        assert right_width == 320

        # Toggle sidebars off
        page.click('[aria-label="Toggle left sidebar"]')
        page.click('[aria-label="Toggle right sidebar"]')
        time.sleep(1)

        left_width_closed = sidebar_left.bounding_box()['width']
        right_width_closed = sidebar_right.bounding_box()['width']
        print(f"Desktop Closed - Left sidebar width: {left_width_closed}, Right sidebar width: {right_width_closed}")
        assert left_width_closed == 0
        assert right_width_closed == 0

        page.screenshot(path='desktop_closed.png')

        # Test Tablet
        print("\nTesting Tablet view (768x1024)...")
        page_tablet = browser.new_page(viewport={'width': 768, 'height': 1024})
        page_tablet.goto('http://localhost:5173')
        time.sleep(2)

        sidebar_left_tab = page_tablet.locator('aside').nth(0)
        sidebar_right_tab = page_tablet.locator('aside').nth(1)

        # Should be closed by default
        assert sidebar_left_tab.bounding_box()['width'] == 0
        assert sidebar_right_tab.bounding_box()['width'] == 0
        print("Tablet - Sidebars are hidden by default")

        # Toggle left sidebar
        page_tablet.click('[aria-label="Toggle left sidebar"]')
        time.sleep(0.5)
        assert sidebar_left_tab.bounding_box()['width'] == 256
        print("Tablet - Left sidebar toggled open")

        # Check backdrop
        backdrop = page_tablet.locator('.fixed.inset-0.bg-black\\/40')
        assert backdrop.is_visible()
        print("Tablet - Backdrop is visible")

        page_tablet.screenshot(path='tablet_left_open.png')

        # Close via backdrop
        page_tablet.click('.fixed.inset-0.bg-black\\/40')
        time.sleep(0.5)
        assert sidebar_left_tab.bounding_box()['width'] == 0
        print("Tablet - Left sidebar closed via backdrop")

        browser.close()

if __name__ == "__main__":
    verify_responsive_sidebars()
