import os
import time
import json
import base64
import csv
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync

app = Flask(__name__)
CORS(app)

# Global state to keep track of the browser and page
state = {
    "playwright": None,
    "browser": None,
    "context": None,
    "page": None,
    "is_scraping": False,
    "stop_scraping": False,
    "scraped_count": 0
}

def ensure_browser():
    if state["page"] is None:
        state["playwright"] = sync_playwright().start()
        # Headless mode is required in this environment
        state["browser"] = state["playwright"].chromium.launch(headless=True)
        state["context"] = state["browser"].new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 800}
        )
        state["page"] = state["context"].new_page()
        stealth_sync(state["page"])
        state["page"].goto("https://oris.mypalmbeachclerk.com/ORIS/Search/QuickSearch")
    return state["page"]

@app.route('/')
def index():
    try:
        page = ensure_browser()
        screenshot = page.screenshot()
        encoded = base64.b64encode(screenshot).decode('utf-8')
    except Exception as e:
        return f"Error: {str(e)}"

    html = f"""
    <html>
        <head>
            <title>Palm Beach Scraper Bridge</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
                #screenshot {{ max-width: 100%; border: 1px solid #334155; border-radius: 8px; cursor: crosshair; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }}
                .container {{ max-width: 1200px; margin: 0 auto; }}
                .controls {{ margin: 20px 0; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }}
                button {{ padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 6px; transition: background 0.2s; }}
                button:hover {{ background: #2563eb; }}
                button.secondary {{ background: #475569; }}
                button.secondary:hover {{ background: #334155; }}
                button.danger {{ background: #ef4444; }}
                button.danger:hover {{ background: #dc2626; }}
                #status {{ margin-top: 15px; font-size: 14px; color: #94a3b8; height: 20px; }}
                .info {{ background: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; text-align: left; border-left: 4px solid #3b82f6; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Palm Beach Clerk Scraper Bridge</h1>
                <div class="info">
                    <strong>Instructions:</strong><br>
                    1. Use the "Quick Search" to find "FIN" (Financing Statement) documents.<br>
                    2. Solve any CAPTCHAs that appear by clicking the verification box on the image.<br>
                    3. Once you see the search results table, click <strong>START AUTO-SCRAPE</strong>.
                </div>
                <div class="controls">
                    <button onclick="navigate('quick')">Go to Quick Search</button>
                    <button class="secondary" onclick="location.reload()">Refresh View</button>
                    <button onclick="autoScrape()">START AUTO-SCRAPE</button>
                    <button class="danger" onclick="stopScrape()">Stop Scrape</button>
                </div>
                <div id="status"></div>
                <img id="screenshot" src="data:image/png;base64,{encoded}" onclick="handleClick(event)">
            </div>

            <script>
                function handleClick(e) {{
                    const img = document.getElementById('screenshot');
                    const rect = img.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
                    const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);

                    document.getElementById('status').innerText = 'Clicking at ' + Math.round(x) + ', ' + Math.round(y) + '...';

                    fetch('/click?x=' + x + '&y=' + y)
                        .then(r => r.json())
                        .then(data => {{
                            document.getElementById('status').innerText = 'Action performed';
                            setTimeout(() => location.reload(), 500);
                        }});
                }}

                function navigate(type) {{
                    document.getElementById('status').innerText = 'Navigating...';
                    fetch('/navigate?type=' + type)
                        .then(r => r.json())
                        .then(() => location.reload());
                }}

                function autoScrape() {{
                    document.getElementById('status').innerText = 'Auto-scrape command sent...';
                    fetch('/auto-scrape')
                        .then(r => r.json())
                        .then(data => {{
                            document.getElementById('status').innerText = data.status;
                        }});
                }}

                function stopScrape() {{
                    fetch('/stop-scrape')
                        .then(r => r.json())
                        .then(data => {{
                            document.getElementById('status').innerText = 'Stopping...';
                        }});
                }}

                // Auto-refresh when scraping is active
                setInterval(() => {{
                    fetch('/status')
                        .then(r => r.json())
                        .then(data => {{
                            if (data.is_scraping) {{
                                document.getElementById('status').innerText = 'Scraping in progress... Count: ' + data.count;
                                // We could auto-refresh the image here but it might be too heavy
                            }}
                        }});
                }}, 2000);
            </script>
        </body>
    </html>
    """
    return html

@app.route('/status')
def get_status():
    return jsonify({
        "is_scraping": state["is_scraping"],
        "count": state["scraped_count"]
    })

@app.route('/click')
def click():
    x = float(request.args.get('x'))
    y = float(request.args.get('y'))
    page = ensure_browser()
    page.mouse.click(x, y)
    return jsonify({"status": "ok"})

@app.route('/navigate')
def navigate():
    nav_type = request.args.get('type', 'quick')
    page = ensure_browser()
    if nav_type == 'quick':
        page.goto("https://oris.mypalmbeachclerk.com/ORIS/Search/QuickSearch")
    return jsonify({"status": "ok"})

@app.route('/stop-scrape')
def stop_scrape():
    state["stop_scraping"] = True
    return jsonify({"status": "stopping"})

@app.route('/auto-scrape')
def auto_scrape():
    if state["is_scraping"]:
        return jsonify({"status": "Already scraping"})

    state["is_scraping"] = True
    state["stop_scraping"] = False
    state["scraped_count"] = 0

    threading.Thread(target=scrape_loop).start()
    return jsonify({"status": "Scrape started"})

def scrape_loop():
    page = state["page"]
    all_rows = []
    page_num = 1

    try:
        while not state["stop_scraping"]:
            print(f"Scraping page {page_num}...")

            # Use more robust selector for the grid
            try:
                # Wait for the table to be visible
                page.wait_for_selector("table.rgMasterTable", timeout=15000)
            except Exception as e:
                print(f"Table not found: {e}")
                break

            # Extract data using robust selectors
            rows = page.query_selector_all("table.rgMasterTable tbody tr")
            if not rows:
                print("No rows found on this page.")
                break

            for row in rows:
                cols = row.query_selector_all("td")
                # Expected columns: Select(0), Detail(1), Direct Name(2), Reverse Name(3),
                # Record Date(4), Doc Type(5), Instrument #(6), Book(7), Page(8)
                if len(cols) >= 7:
                    try:
                        data = {
                            "Direct Name": cols[2].inner_text().strip(),
                            "Reverse Name": cols[3].inner_text().strip(),
                            "Record Date": cols[4].inner_text().strip(),
                            "Doc Type": cols[5].inner_text().strip(),
                            "Instrument Number": cols[6].inner_text().strip(),
                            "Book": cols[7].inner_text().strip() if len(cols) > 7 else "",
                            "Page": cols[8].inner_text().strip() if len(cols) > 8 else "",
                        }
                        # Only add if it's not a header or empty row
                        if data["Instrument Number"]:
                            all_rows.append(data)
                            state["scraped_count"] += 1
                    except Exception as e:
                        print(f"Error parsing row: {e}")

            # Save progress incrementally
            save_data(all_rows)

            # Robust "Next" button detection
            # The Telerik grid uses an input with title="Next Page" or class "rgPageNext"
            next_btn = page.query_selector("input.rgPageNext")
            if next_btn and next_btn.is_enabled():
                next_btn.click()
                # Wait for network idle or for the table to refresh
                time.sleep(4)
                page_num += 1
            else:
                print("Next button not found or disabled. End of results.")
                break
    except Exception as e:
        print(f"Scrape loop error: {e}")
    finally:
        state["is_scraping"] = False
        print(f"Scraping finished. Total records: {len(all_rows)}")

def save_data(data):
    if not data:
        return
    os.makedirs("Data/PalmBeach_FIN", exist_ok=True)
    filepath = "Data/PalmBeach_FIN/scraped_data.csv"
    with open(filepath, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    # Ensure port is not in use by other processes we might have left
    # But we don't use os.system("kill ...") here as requested.
    app.run(host='0.0.0.0', port=3000, threaded=True)
