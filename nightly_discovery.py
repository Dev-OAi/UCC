import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta

# Configuration
INPUT_FILE = "Data/UCC Results/all_results.csv"
OUTPUT_FILE = "Business_Intelligence.csv"

def web_search_clues(business_name):
    """
    Search for growth signals (hiring, expansion, new sites).
    """
    try:
        query = f"{business_name} hiring expansion new office"
        url = f"https://www.google.com/search?q={query}&gbv=1"
        headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            results = soup.find_all(['div', 'h3'], class_=['kCrYT', 'BNeawe'])
            text = " ".join([r.get_text() for r in results[:5]])

            # Look for keywords
            clues = []
            if re.search(r'hiring|careers|jobs|opening', text, re.I):
                clues.append("Active Hiring Detected")
            if re.search(r'expansion|new location|new site|branch', text, re.I):
                clues.append("Growth/Expansion Signals")
            if re.search(r'acquisition|merger|bought', text, re.I):
                clues.append("M&A Activity")

            return " | ".join(clues) if clues else "Stable Operations"
    except:
        pass
    return "Research Pending"

def main():
    print(f"--- STARTING NIGHTLY DISCOVERY ---")

    if not os.path.exists(INPUT_FILE):
        print("No UCC data found.")
        return

    # Load recent filings
    df = pd.read_csv(INPUT_FILE)
    if 'Date Filed' not in df.columns:
        print("Date Filed column missing.")
        return

    # Filter for last 48 hours to be safe
    df['Date Filed'] = pd.to_datetime(df['Date Filed'], errors='coerce')
    cutoff = datetime.now() - timedelta(days=2)
    recent_leads = df[df['Date Filed'] >= cutoff]

    if recent_leads.empty:
        print("No new leads in the last 48 hours.")
        return

    print(f"Found {len(recent_leads)} new leads. Running discovery...")

    intel_data = []
    for _, row in recent_leads.iterrows():
        name = row.get('Search Term') or row.get('Debtor Name')
        if not name: continue

        print(f"  Researching: {name}")
        clue = web_search_clues(name)

        intel_data.append({
            'Business Name': name,
            'NAICS_Code': 'Pending',
            'Industry_Pain_Point': clue,
            'Suppliers_Customers': 'Discovery phase'
        })

    # Update intelligence file
    new_intel_df = pd.DataFrame(intel_data)
    if os.path.exists(OUTPUT_FILE):
        existing_df = pd.read_csv(OUTPUT_FILE)
        # Avoid duplicates
        combined_df = pd.concat([existing_df, new_intel_df]).drop_duplicates(subset=['Business Name'], keep='last')
        combined_df.to_csv(OUTPUT_FILE, index=False)
    else:
        new_intel_df.to_csv(OUTPUT_FILE, index=False)

    print(f"NIGHTLY DISCOVERY COMPLETE. {len(intel_data)} records updated.")

if __name__ == "__main__":
    main()
