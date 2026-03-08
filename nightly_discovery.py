import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import glob
import time
import random

# --- CONFIGURATION ---
OUTPUT_FILE = "Data/Intelligence/Business_Intelligence.csv"
MAX_LEADS_PER_RUN = 20  # Prevent overwhelming the server/rate-limiting
REQUEST_DELAY_RANGE = (2, 5)  # Seconds to wait between requests
MAX_RUNTIME_MINUTES = 10 # Safety kill switch for CI

# Potential column names for Business Name and Date
BUSINESS_NAME_COLS = [
    'Search Term', 'Direct Name', 'DirectName', 'Corporate Name (Search)',
    'Debtor Name', 'Name', 'LEGALNAME', 'DirectName (Search)', 'Corporate Name'
]
DATE_COLS = [
    'Date Filed', 'Record Date Search', 'RecordDate', 'Filing Date',
    'Date Filed (UCC)', 'Record Date'
]

def web_search_clues(business_name):
    """
    Multi-Vector Research: Search for growth signals (hiring, expansion, new sites).
    """
    try:
        if len(str(business_name)) < 3:
            return "Insufficient Data", 0

        # Multi-Vector Query: Combining growth, hiring, and construction signals
        query = f'"{business_name}" (hiring OR "new location" OR construction OR expansion)'
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}&gbv=1"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'
        }

        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            results = soup.find_all(['div', 'h3'], class_=['kCrYT', 'BNeawe'])
            text = " ".join([r.get_text() for r in results[:8]])

            clues = []
            score = 0

            # Vector 1: Hiring (Strongest growth signal for bankers)
            if re.search(r'hiring|careers|jobs|opening|apply now|recruiting', text, re.I):
                clues.append("Active Hiring")
                score += 40

            # Vector 2: Physical Expansion (Commercial lending / SBA trigger)
            if re.search(r'expansion|new location|new site|branch|grand opening|expanded|lease', text, re.I):
                clues.append("Physical Expansion")
                score += 40

            # Vector 3: Construction/Permits (Development focus)
            if re.search(r'construction|permit|development|project|renovation', text, re.I):
                clues.append("Construction Activity")
                score += 30

            # Vector 4: M&A / Scaling
            if re.search(r'acquisition|merger|bought|acquired|scaling', text, re.I):
                clues.append("M&A/Scaling")
                score += 20

            result_text = " | ".join(clues) if clues else "Stable Operations"
            return result_text, min(score, 100)

        return f"Service Unavailable ({res.status_code})", 0
    except Exception as e:
        return f"Research Failed: {str(e)}", 0

def get_recent_leads_from_file(filepath):
    """
    Extracts leads and their filing dates for prioritization.
    """
    try:
        if not filepath.endswith('.csv'): return pd.DataFrame()

        df_head = pd.read_csv(filepath, nrows=5, low_memory=False)
        name_col = next((c for c in df_head.columns if c in BUSINESS_NAME_COLS), None)
        date_col = next((c for c in df_head.columns if c in DATE_COLS), None)

        if not name_col or not date_col:
            return pd.DataFrame()

        df = pd.read_csv(filepath, low_memory=False)
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')

        # Filter for last 72 hours
        cutoff = datetime.now() - timedelta(days=3)
        recent = df[df[date_col] >= cutoff].copy()

        if recent.empty:
            return pd.DataFrame()

        # Keep the date for sorting
        recent = recent[[name_col, date_col]].rename(columns={name_col: 'Business Name', date_col: 'FilingDate'})
        recent['Business Name'] = recent['Business Name'].astype(str).str.strip().str.upper()
        recent = recent[recent['Business Name'] != 'NAN']

        return recent
    except:
        return pd.DataFrame()

def main():
    start_time = time.time()
    print(f"--- STARTING RESPONSIBLE DISCOVERY: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    all_recent_leads = []
    csv_files = glob.glob("Data/**/*.csv", recursive=True)

    for f in csv_files:
        if "Business_Intelligence" in f: continue
        leads = get_recent_leads_from_file(f)
        if not leads.empty:
            all_recent_leads.append(leads)

    if os.path.exists(OUTPUT_FILE):
        existing_df = pd.read_csv(OUTPUT_FILE)
    else:
        existing_df = pd.DataFrame(columns=['Business Name', 'NAICS_Code', 'Industry_Pain_Point', 'Suppliers_Customers', 'Growth_Score'])

    if not all_recent_leads:
        print("No recent signals found. Sync complete.")
        existing_df.to_csv(OUTPUT_FILE, index=False)
        return

    # Prioritize by most recent filing date
    combined_leads = pd.concat(all_recent_leads).sort_values(by='FilingDate', ascending=False)
    combined_leads = combined_leads.drop_duplicates(subset=['Business Name'])

    # Filter for BRAND NEW leads only
    new_leads = combined_leads[~combined_leads['Business Name'].isin(existing_df['Business Name'])]

    if new_leads.empty:
        print("No new unique businesses to research.")
        existing_df.to_csv(OUTPUT_FILE, index=False)
        return

    # Apply MAX_LEADS_PER_RUN limit
    process_queue = new_leads.head(MAX_LEADS_PER_RUN)
    print(f"Found {len(new_leads)} new leads. Capping research to top {len(process_queue)} by recency.")

    intel_data = []
    for i, (_, row) in enumerate(process_queue.iterrows()):
        # Check runtime safety
        if (time.time() - start_time) / 60 > MAX_RUNTIME_MINUTES:
            print("!!! Max runtime reached. Saving progress and exiting.")
            break

        name = row['Business Name']
        if not name or name == 'NONE': continue

        print(f"  [{i+1}/{len(process_queue)}] Researching: {name}...")
        clue, score = web_search_clues(name)

        intel_data.append({
            'Business Name': name,
            'NAICS_Code': 'Pending',
            'Industry_Pain_Point': clue,
            'Suppliers_Customers': 'Discovery phase',
            'Growth_Score': score
        })

        # Responsible Pause
        if i < len(process_queue) - 1:
            delay = random.uniform(*REQUEST_DELAY_RANGE)
            time.sleep(delay)

    # Update intelligence file
    new_intel_df = pd.DataFrame(intel_data)

    # Ensure all columns match for concat
    for col in ['Growth_Score']:
        if col not in existing_df.columns:
            existing_df[col] = 0

    final_df = pd.concat([existing_df, new_intel_df]).drop_duplicates(subset=['Business Name'], keep='last')
    final_df.to_csv(OUTPUT_FILE, index=False)

    print(f"--- DISCOVERY COMPLETE: {len(intel_data)} researched, {len(new_leads) - len(intel_data)} deferred ---")

if __name__ == "__main__":
    main()
