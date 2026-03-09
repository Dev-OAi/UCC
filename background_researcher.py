import os
import pandas as pd
import ollama
import re
import json
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime

INTEL_FILE = "Data/Intelligence/Business_Intelligence.csv"
BANKING_RULES = """
- ROLE: Senior Bank Expert Commercial Banker.
- CORE PRODUCTS: SMB Bundles, SBA Loans, Treasury Management (RDC, Positive Pay), Merchant Services, ADP Payroll.
- TARGET: High-value relationships, expansion-minded businesses.
"""

def web_research(business_name):
    """Deep research logic using multi-vector search."""
    vectors = [
        f"{business_name} official website",
        f"{business_name} news growth expansion",
        f"{business_name} operations location"
    ]
    all_text = ""
    for v in vectors:
        try:
            url = f"https://www.google.com/search?q={v.replace(' ', '+')}&gbv=1"
            headers = {'User-Agent': 'Mozilla/5.0'}
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                results = soup.find_all(['div', 'h3'], class_=['kCrYT', 'BNeawe'])
                all_text += " ".join([r.get_text() for r in results[:5]]) + " "
            time.sleep(1)
        except:
            continue
    return all_text[:5000]

def main():
    print(f"--- STARTING BACKGROUND RESEARCHER: {datetime.now()} ---")

    if not os.path.exists(INTEL_FILE):
        print("No intelligence file found. Nothing to research.")
        return

    df = pd.read_csv(INTEL_FILE)

    # Target leads that were found by Nightly Discovery but not yet deep-researched
    to_upgrade = df[(df['NAICS_Code'] == 'Pending') | (df['Suppliers_Customers'] == 'Discovery phase')].head(10)

    if to_upgrade.empty:
        print("All current signals are fully researched.")
        return

    print(f"Upgrading {len(to_upgrade)} leads with Deep Intelligence...")

    for index, row in to_upgrade.iterrows():
        name = row['Business Name']
        print(f"  [Deep Researching] {name}...")

        context = web_research(name)

        prompt = f"""
        ROLE: Senior Bank Expert.
        BUSINESS: {name}
        RESEARCH: {context}
        RULES: {BANKING_RULES}

        TASK:
        1. Identify Industry & 6-digit NAICS Code.
        2. Identify 3 specific banking product needs.
        3. Detect growth signals (expansion, hiring).
        4. Summarize strategic intelligence.

        OUTPUT FORMAT (JSON ONLY):
        {{
            "naics": "...",
            "products": ["..."],
            "signals": ["..."],
            "intelligence": "..."
        }}
        """

        try:
            response = ollama.generate(model="lfm2.5-thinking:1.2b", prompt=prompt)
            ai_text = response['response']
            json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)

            if json_match:
                ai_data = json.loads(json_match.group())

                df.at[index, 'NAICS_Code'] = ai_data.get('naics', 'Unknown')
                df.at[index, 'Industry_Pain_Point'] = ai_data.get('intelligence', row['Industry_Pain_Point'])
                df.at[index, 'Suppliers_Customers'] = ", ".join(ai_data.get('signals', []))

                print(f"    [Success] NAICS: {ai_data.get('naics')} | Industry: {ai_data.get('intelligence')[:50]}...")
            else:
                print(f"    [Error] AI response format invalid for {name}")
        except Exception as e:
            print(f"    [Error] Failed researching {name}: {e}")

    df.to_csv(INTEL_FILE, index=False)
    print(f"--- BACKGROUND RESEARCH COMPLETE: {INTEL_FILE} updated ---")

if __name__ == "__main__":
    main()
