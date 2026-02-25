import csv
import requests
import time
import os
import sys
import subprocess
from datetime import datetime

API_BASE = "https://publicsearchapi.floridaucc.com"

SEARCH_PARAMS = {
    "searchOptionType": "LegacySearch",
    "searchOptionSubOption": "FiledAndLapsedActualDebtorNameList",
    "searchCategory": "Standard"
}

REQUEST_DELAY = 0.5
MAX_RESULTS_PER_NAME = 10
OUTPUT_FILE = "Data/UCC Results/all_results.csv"

def search_debtor(name):
    url = f"{API_BASE}/Search"
    params = {**SEARCH_PARAMS, "text": name}
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("payload", {}).get("debtors", [])[:MAX_RESULTS_PER_NAME]
    except Exception as e:
        print(f"Error searching debtor {name}: {e}")
        return []

def get_filing_details(row_number, search_text):
    url = f"{API_BASE}/filing-details"
    params = {
        **SEARCH_PARAMS,
        "rowNumber": row_number,
        "text": search_text
    }
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json().get("payload", {})
    except Exception as e:
        print(f"Error getting filing details for {row_number}: {e}")
        return {}

def format_address(entity):
    parts = []
    if entity.get("address"):
        parts.append(entity["address"])
    if entity.get("city"):
        parts.append(entity["city"])
    if entity.get("state"):
        parts.append(entity["state"])
    if entity.get("zipCode"):
        parts.append(entity["zipCode"])
    return ", ".join(parts)

def format_date(date_str):
    if not date_str:
        return ""
    try:
        # ISO format: 2002-04-15T04:00:00Z
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%m/%d/%Y')
    except:
        return date_str

def read_input_csv(filepath):
    names = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers:
                return []

            # Column detection
            name_idx = 0 # Default to first column
            possible_names = ["business name", "entity name", "name", "business", "company"]
            for i, h in enumerate(headers):
                if h.lower().strip() in possible_names:
                    name_idx = i
                    break

            for row in reader:
                if row and len(row) > name_idx and row[name_idx].strip():
                    names.append(row[name_idx].strip())
    except Exception as e:
        print(f"Error reading input CSV {filepath}: {e}")
    return names

def write_output_csv(results):
    fieldnames = [
        "Search Term", "Status", "Date Filed", "Expires",
        "Filings Completed Through", "UCC Number", "Filing Events",
        "Secured Parties Count", "Secured Party Name", "Secured Party Address",
        "Debtor Parties Count", "Debtor Name", "Debtor Address",
        "Document Type", "Document Pages"
    ]

    file_exists = os.path.isfile(OUTPUT_FILE)

    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        for r in results:
            writer.writerow(r)

def main(input_file):
    print(f"[{datetime.now()}] Processing {input_file}...")
    names = read_input_csv(input_file)
    print(f"Found {len(names)} names to search.")

    all_results = []

    for idx, name in enumerate(names):
        print(f"  [{idx+1}/{len(names)}] Searching: {name}")

        debtors = search_debtor(name)
        time.sleep(REQUEST_DELAY)

        if not debtors:
            all_results.append({
                "Search Term": name,
                "Status": "No results",
                "Date Filed": "", "Expires": "",
                "Filings Completed Through": "", "UCC Number": "",
                "Filing Events": "", "Secured Parties Count": "",
                "Secured Party Name": "", "Secured Party Address": "",
                "Debtor Parties Count": "", "Debtor Name": "", "Debtor Address": "",
                "Document Type": "", "Document Pages": ""
            })
            continue

        for deb in debtors:
            row_number = deb.get("rowNumber")
            details = get_filing_details(row_number, name)
            time.sleep(REQUEST_DELAY)

            secureds = details.get("secureds", [])
            debtors_list = details.get("debtors", [])

            result = {
                "Search Term": name,
                "Status": details.get("status", ""),
                "Date Filed": format_date(details.get("fileDate", "")),
                "Expires": format_date(details.get("expirationDate", "")),
                "Filings Completed Through": format_date(details.get("filingsCompletedThrough", "")),
                "UCC Number": details.get("uccNumber", ""),
                "Filing Events": details.get("filingEvents", ""),
                "Secured Parties Count": details.get("securedPartiesTotalCount", ""),
                "Secured Party Name": secureds[0].get("name", "") if secureds else "",
                "Secured Party Address": format_address(secureds[0]) if secureds else "",
                "Debtor Parties Count": details.get("debtorPartiesTotalCount", ""),
                "Debtor Name": debtors_list[0].get("name", "") if debtors_list else "",
                "Debtor Address": format_address(debtors_list[0]) if debtors_list else "",
                "Document Type": details.get("documentType", ""),
                "Document Pages": details.get("documentPagesCount", "")
            }
            all_results.append(result)

    if all_results:
        write_output_csv(all_results)
        print(f"Wrote {len(all_results)} results to {OUTPUT_FILE}")

        # Regenerate manifest
        print("Regenerating manifest...")
        subprocess.run(["python3", "generate_manifest.py"])
    else:
        print("No results to write.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ucc_worker.py <input_csv>")
        sys.exit(1)

    main(sys.argv[1])
