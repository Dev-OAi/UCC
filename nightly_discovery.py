import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import glob

# Configuration
OUTPUT_FILE = "Data/Intelligence/Business_Intelligence.csv"

# Potential column names for Business Name and Date
BUSINESS_NAME_COLS = [
    'Search Term', 'Direct Name', 'DirectName', 'Corporate Name (Search)',
    'Debtor Name', 'Name', 'LEGALNAME', 'DirectName (Search)', 'Corporate Name',
    'COMPANY', 'Entity Name', 'Business Name', 'DirectName (Search)', 'Debtor 1 Name'
]
DATE_COLS = [
    'Date Filed', 'Record Date Search', 'RecordDate', 'Filing Date',
    'Date Filed (UCC)', 'Record Date', 'Effective Date', 'Filed Date', 'RecordDate'
]

def web_search_clues(business_name):
    """
    Search for growth signals (hiring, expansion, new sites).
    Uses a lightweight scraping approach suitable for CI environments.
    """
    try:
        # Avoid researching generic names or too short strings
        if len(str(business_name)) < 3:
            return "Insufficient Data"

        query = f"{business_name} hiring expansion new office"
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}&gbv=1"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Look for common Google result containers in GBV=1 mode
            results = soup.find_all(['div', 'h3'], class_=['kCrYT', 'BNeawe'])
            text = " ".join([r.get_text() for r in results[:10]])

            # Look for keywords
            clues = []
            if re.search(r'hiring|careers|jobs|opening|apply now|recruiting', text, re.I):
                clues.append("Active Hiring Detected")
            if re.search(r'expansion|new location|new site|branch|grand opening|expanded', text, re.I):
                clues.append("Growth/Expansion Signals")
            if re.search(r'acquisition|merger|bought|acquired|purchased', text, re.I):
                clues.append("M&A Activity")
            if re.search(r'lawsuit|legal|court|litigation', text, re.I):
                clues.append("Legal Headwinds")

            return " | ".join(clues) if clues else "Stable Operations"
        else:
            return f"Search Error ({res.status_code})"
    except Exception as e:
        return f"Research Failed: {str(e)}"

def get_recent_leads_from_file(filepath):
    """
    Attempts to extract leads from a CSV using flexible matching and fallback index detection.
    """
    try:
        if not filepath.endswith('.csv'): return pd.DataFrame()

        # Load first row to check if it's a header
        df_check = pd.read_csv(filepath, nrows=1, header=None)
        if df_check.empty: return pd.DataFrame()

        first_row = [str(x).strip() for x in df_check.iloc[0]]
        has_header = any(col in BUSINESS_NAME_COLS for col in first_row)

        if has_header:
            df = pd.read_csv(filepath, low_memory=False)
            name_col = next((c for c in df.columns if c in BUSINESS_NAME_COLS), None)
            date_col = next((c for c in df.columns if c in DATE_COLS), None)
        else:
            # NO HEADER FALLBACK: Use common patterns based on observation
            # Zip hubs (33401, etc) often have Name in col 0, Date in col 4 or 5
            df = pd.read_csv(filepath, header=None, low_memory=False)
            name_col = 0
            # Heuristic: Find first col that looks like a date
            date_col = None
            for i in range(min(10, len(df.columns))):
                sample = str(df.iloc[0, i])
                if re.match(r'\d{1,2}/\d{1,2}/\d{2,4}', sample):
                    date_col = i
                    break

            if date_col is None:
                # If no date found, we can't determine "newness", but we might still want to learn
                # For discovery, we strict-skip. For learning, mapper will pick it up.
                return pd.DataFrame()

        # Read full file logic
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        cutoff = datetime.now() - timedelta(days=3)
        recent = df[df[date_col] >= cutoff].copy()

        if recent.empty: return pd.DataFrame()

        # Normalize output
        recent = recent[[name_col]].rename(columns={name_col: 'Business Name'})
        recent['Business Name'] = recent['Business Name'].astype(str).str.strip().str.upper()
        recent = recent[(recent['Business Name'] != 'NAN') & (recent['Business Name'] != '')]

        return recent
    except Exception as e:
        print(f"  [Error] Failed to process {filepath}: {e}")
        return pd.DataFrame()

def main():
    print(f"--- STARTING NIGHTLY DISCOVERY: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    all_recent_leads = []

    # Scan Data directory recursively
    csv_files = glob.glob("Data/**/*.csv", recursive=True)
    print(f"Scanning {len(csv_files)} CSV files for recent growth signals...")

    for f in csv_files:
        if "Business_Intelligence" in f: continue
        leads = get_recent_leads_from_file(f)
        if not leads.empty:
            print(f"  [Found] {len(leads)} recent leads in {f}")
            all_recent_leads.append(leads)

    # Initialize or load existing intelligence
    if os.path.exists(OUTPUT_FILE):
        existing_df = pd.read_csv(OUTPUT_FILE)
    else:
        existing_df = pd.DataFrame(columns=['Business Name', 'NAICS_Code', 'Industry_Pain_Point', 'Suppliers_Customers'])

    if not all_recent_leads:
        print("No new leads found in the last 72 hours. Ensuring Intelligence file is present.")
        existing_df.to_csv(OUTPUT_FILE, index=False)
        return

    combined_leads = pd.concat(all_recent_leads).drop_duplicates(subset=['Business Name'])

    # Filter out leads we already have intelligence for (to save on scraping)
    new_leads = combined_leads[~combined_leads['Business Name'].isin(existing_df['Business Name'])]

    if new_leads.empty:
        print("No brand-new businesses to research tonight.")
        existing_df.to_csv(OUTPUT_FILE, index=False)
        return

    print(f"Researching {len(new_leads)} new business signals...")

    intel_data = []
    for _, row in new_leads.iterrows():
        name = row['Business Name']
        if not name or name == 'NONE': continue

        print(f"  [Researching] {name}...")
        clue = web_search_clues(name)

        intel_data.append({
            'Business Name': name,
            'NAICS_Code': 'Pending',
            'Industry_Pain_Point': clue,
            'Suppliers_Customers': 'Discovery phase'
        })

    # Update intelligence file
    new_intel_df = pd.DataFrame(intel_data)
    final_df = pd.concat([existing_df, new_intel_df]).drop_duplicates(subset=['Business Name'], keep='last')
    final_df.to_csv(OUTPUT_FILE, index=False)

    print(f"--- NIGHTLY DISCOVERY COMPLETE: {len(intel_data)} records updated ---")

if __name__ == "__main__":
    main()
