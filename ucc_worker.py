import csv
import requests
import time
import os
import sys
import subprocess
import random
import json
import argparse
from datetime import datetime
from difflib import SequenceMatcher

# Configuration
API_BASE = "https://publicsearchapi.floridaucc.com"
SEARCH_PARAMS = {
    "searchOptionType": "LegacySearch",
    "searchOptionSubOption": "FiledAndLapsedActualDebtorNameList",
    "searchCategory": "Standard"
}

# Defaults (Standard Mode)
REQUEST_DELAY = 2.0  # Increased to 2.0s per user request
MAX_RESULTS_PER_NAME = 10
MAX_RETRIES = 3

CHECKPOINT_INTERVAL = 15
RUN_TIME_MINUTES = 5
PAUSE_SECONDS = 30
MAX_SECURED_PARTIES = 5
OUTPUT_FILE = "Data/UCC Results/all_results.csv"
CHECKPOINT_DIR = "public/Uploads/.checkpoints"
STATUS_DIR = "public/Uploads/status"

def similarity_score(a, b):
    a = a.upper().strip()
    b = b.upper().strip()
    a_clean = ''.join(c for c in a if c.isalnum() or c.isspace())
    b_clean = ''.join(c for c in b if c.isalnum() or c.isspace())
    return SequenceMatcher(None, a_clean, b_clean).ratio()

def is_close_match(search_term, result_name, threshold=0.7, mode='standard'):
    score = similarity_score(search_term, result_name)

    if mode == 'lite':
        # Dynamic threshold logic from v6
        search_len = len(search_term)
        if search_len <= 5:
            effective_threshold = 0.5
        elif search_len <= 10:
            effective_threshold = 0.6
        elif search_len <= 20:
            effective_threshold = 0.7
        else:
            effective_threshold = 0.75

        return score >= effective_threshold, score

    return score >= threshold, score

def search_debtor(name):
    url = f"{API_BASE}/Search"
    params = {**SEARCH_PARAMS, "text": name}

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, params=params, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("payload", {}).get("debtors", [])[:MAX_RESULTS_PER_NAME]
            else:
                msg = f"API error {resp.status_code} on search '{name}', retrying ({attempt+1}/{MAX_RETRIES})..."
                print(f"    {msg}")
                update_status_error(msg)
                time.sleep(random.randint(10, 30))
        except Exception as e:
            msg = f"Exception during search '{name}': {e}, retrying..."
            print(f"    {msg}")
            update_status_error(msg)
            time.sleep(random.randint(10, 30))

    return []

def get_filing_details(row_number, search_text):
    url = f"{API_BASE}/filing-details"
    params = {
        **SEARCH_PARAMS,
        "rowNumber": row_number,
        "text": search_text
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, params=params, timeout=30)
            if resp.status_code == 200:
                return resp.json().get("payload", {})
            else:
                msg = f"API error {resp.status_code} on details fetch, retrying ({attempt+1}/{MAX_RETRIES})..."
                print(f"    {msg}")
                update_status_error(msg)
                time.sleep(random.randint(10, 30))
        except Exception as e:
            msg = f"Exception during details fetch: {e}, retrying..."
            print(f"    {msg}")
            update_status_error(msg)
            time.sleep(random.randint(10, 30))

    return {}

def format_address(entity):
    parts = []
    if entity.get("address"): parts.append(entity["address"])
    if entity.get("city"): parts.append(entity["city"])
    if entity.get("state"): parts.append(entity["state"])
    if entity.get("zipCode"): parts.append(entity["zipCode"])
    return ", ".join(parts)

def format_date(date_str):
    if not date_str: return ""
    try:
        if 'T' in date_str:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%m/%d/%Y')
        return date_str
    except:
        return date_str

def read_input_csv(filepath, target_column=None):
    names = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers: return []

            name_idx = 0
            if target_column is not None:
                try:
                    name_idx = int(target_column)
                except ValueError:
                    # Treat as header name
                    for i, h in enumerate(headers):
                        if h.lower().strip() == target_column.lower().strip():
                            name_idx = i
                            break
            else:
                # Auto detection
                possible_names = ["business name", "entity name", "name", "business", "company", "directname", "debtor"]
                for i, h in enumerate(headers):
                    h_clean = h.lower().strip()
                    if any(p in h_clean for p in possible_names):
                        name_idx = i
                        print(f"Auto-detected name column: '{h}' at index {i}")
                        break

            for row in reader:
                if row and len(row) > name_idx and row[name_idx].strip():
                    names.append(row[name_idx].strip())
    except Exception as e:
        print(f"Error reading input CSV {filepath}: {e}")
    return names

def get_fieldnames():
    fieldnames = [
        "Search Term", "Match Score", "Status", "Date Filed", "Expires",
        "Filings Completed Through", "UCC Number", "Filing Events",
        "Secured Parties Count"
    ]
    for i in range(1, MAX_SECURED_PARTIES + 1):
        fieldnames.extend([f"Secured Party {i} Name", f"Secured Party {i} Address"])
    fieldnames.extend(["Debtor Parties Count", "Debtor Name", "Debtor Address", "Document Type", "Document Pages"])
    return fieldnames

def write_results_to_output(results):
    if not results: return
    fieldnames = get_fieldnames()
    file_exists = os.path.isfile(OUTPUT_FILE)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Portably handle locking if possible, else just write
    try:
        import fcntl
        lock_support = True
    except ImportError:
        lock_support = False

    with open(OUTPUT_FILE, 'a', newline='', encoding='utf-8') as f:
        if lock_support: fcntl.flock(f, fcntl.LOCK_EX)
        try:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not file_exists: writer.writeheader()
            for r in results:
                writer.writerow(r)
        finally:
            if lock_support: fcntl.flock(f, fcntl.LOCK_UN)

# Status Management
CURRENT_JOB_ID = ""
JOB_STATUS = {
    "filename": "",
    "progress": 0,
    "total": 0,
    "current_name": "",
    "status": "Starting",
    "errors": [],
    "start_time": "",
    "results": [] # Real-time results for frontend
}

def update_status_file():
    if not CURRENT_JOB_ID: return
    os.makedirs(STATUS_DIR, exist_ok=True)
    # Sanitize job_id to prevent traversal
    safe_job_id = os.path.basename(CURRENT_JOB_ID)
    status_path = os.path.join(STATUS_DIR, f"{safe_job_id}.json")
    with open(status_path, 'w') as f:
        json.dump(JOB_STATUS, f)

def update_status_error(error_msg):
    JOB_STATUS["errors"].append(f"[{datetime.now().strftime('%H:%M:%S')}] {error_msg}")
    if len(JOB_STATUS["errors"]) > 20: JOB_STATUS["errors"].pop(0)
    update_status_file()

def save_checkpoint(filename, processed_count):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    safe_filename = os.path.basename(filename)
    cp_path = os.path.join(CHECKPOINT_DIR, f"{safe_filename}.json")
    with open(cp_path, 'w') as f:
        json.dump({"processed_count": processed_count}, f)

def load_checkpoint(filename):
    safe_filename = os.path.basename(filename)
    cp_path = os.path.join(CHECKPOINT_DIR, f"{safe_filename}.json")
    if os.path.exists(cp_path):
        with open(cp_path, 'r') as f:
            return json.load(f).get("processed_count", 0)
    return 0

def main():
    global REQUEST_DELAY, MAX_RESULTS_PER_NAME, MAX_RETRIES

    parser = argparse.ArgumentParser(description="UCC Scraper Worker")
    parser.add_argument("input_file", nargs="?", help="Path to input CSV")
    parser.add_argument("--names", help="Pipe-separated list of business names to search")
    parser.add_argument("--threshold", type=float, default=0.7, help="Similarity threshold (0.0 to 1.0)")
    parser.add_argument("--column", help="Column name or index for business names")
    parser.add_argument("--job_id", help="Job ID for status tracking")
    parser.add_argument("--mode", default="standard", choices=["standard", "lite"], help="Scraping mode")
    args = parser.parse_args()

    if args.mode == "lite":
        REQUEST_DELAY = 1.0
        MAX_RESULTS_PER_NAME = 3
        MAX_RETRIES = 2
        print("Running in LITE mode (faster, dynamic thresholds)")

    if args.names:
        all_names = [n.strip() for n in args.names.split('|') if n.strip()]
        filename = f"manual_{int(time.time())}.csv"
    elif args.input_file:
        all_names = read_input_csv(args.input_file, args.column)
        filename = os.path.basename(args.input_file)
    else:
        print("Error: Either input_file or --names must be provided.")
        return

    global CURRENT_JOB_ID
    CURRENT_JOB_ID = args.job_id or filename

    JOB_STATUS["filename"] = filename
    JOB_STATUS["status"] = "Preparing"
    JOB_STATUS["start_time"] = datetime.now().isoformat()
    update_status_file()

    print(f"[{datetime.now()}] Worker processing {filename} (Threshold: {args.threshold})")

    start_idx = load_checkpoint(filename)

    JOB_STATUS["total"] = len(all_names)
    JOB_STATUS["progress"] = (start_idx / len(all_names)) * 100 if all_names else 100
    JOB_STATUS["status"] = "Scraping"
    update_status_file()

    if start_idx >= len(all_names):
        print(f"All {len(all_names)} names already processed.")
        JOB_STATUS["status"] = "Completed"
        JOB_STATUS["progress"] = 100
        update_status_file()
        return

    names_to_process = all_names[start_idx:]
    start_time_run = time.time()
    pause_limit = RUN_TIME_MINUTES * 60

    for idx, name in enumerate(names_to_process):
        current_idx = start_idx + idx + 1
        print(f"  [{current_idx}/{len(all_names)}] Searching: {name}")

        JOB_STATUS["progress"] = (current_idx / len(all_names)) * 100
        JOB_STATUS["current_name"] = name
        update_status_file()

        debtors = search_debtor(name)
        time.sleep(REQUEST_DELAY)

        name_results = []
        if not debtors:
            name_results.append({
                "Search Term": name, "Match Score": "0.00", "Status": "No results",
                "Date Filed": "", "Expires": "", "Filings Completed Through": "", "UCC Number": "", "Filing Events": "", "Secured Parties Count": "",
                **{f"Secured Party {i} Name": "" for i in range(1, MAX_SECURED_PARTIES + 1)},
                **{f"Secured Party {i} Address": "" for i in range(1, MAX_SECURED_PARTIES + 1)},
                "Debtor Parties Count": "", "Debtor Name": "", "Debtor Address": "", "Document Type": "", "Document Pages": ""
            })
        else:
            matches = []
            for d in debtors:
                is_match, score = is_close_match(name, d.get("name", ""), args.threshold, mode=args.mode)
                if is_match: matches.append((d, score))

            if not matches:
                name_results.append({
                    "Search Term": name, "Match Score": "0.00", "Status": "No close match",
                    "Date Filed": "", "Expires": "", "Filings Completed Through": "", "UCC Number": "", "Filing Events": "", "Secured Parties Count": "",
                    **{f"Secured Party {i} Name": "" for i in range(1, MAX_SECURED_PARTIES + 1)},
                    **{f"Secured Party {i} Address": "" for i in range(1, MAX_SECURED_PARTIES + 1)},
                    "Debtor Parties Count": "", "Debtor Name": "", "Debtor Address": "", "Document Type": "", "Document Pages": ""
                })
            else:
                for deb, score in matches:
                    row_number = deb.get("rowNumber")
                    details = get_filing_details(row_number, name)
                    time.sleep(REQUEST_DELAY)

                    secureds = details.get("secureds", [])
                    debtors_list = details.get("debtors", [])

                    res_dict = {
                        "Search Term": name, "Match Score": f"{score:.2f}", "Status": details.get("status", ""),
                        "Date Filed": format_date(details.get("fileDate", "")),
                        "Expires": format_date(details.get("expirationDate", "")),
                        "Filings Completed Through": format_date(details.get("filingsCompletedThrough", "")),
                        "UCC Number": details.get("uccNumber", ""), "Filing Events": details.get("filingEvents", ""),
                        "Secured Parties Count": details.get("securedPartiesTotalCount", ""),
                        "Debtor Parties Count": details.get("debtorPartiesTotalCount", ""),
                        "Debtor Name": debtors_list[0].get("name", "") if debtors_list else "",
                        "Debtor Address": format_address(debtors_list[0]) if debtors_list else "",
                        "Document Type": details.get("documentType", ""), "Document Pages": details.get("documentPagesCount", "")
                    }
                    for i in range(1, MAX_SECURED_PARTIES + 1):
                        s_name = secureds[i-1].get("name", "") if (i-1) < len(secureds) else ""
                        s_addr = format_address(secureds[i-1]) if (i-1) < len(secureds) else ""
                        res_dict[f"Secured Party {i} Name"] = s_name
                        res_dict[f"Secured Party {i} Address"] = s_addr
                    name_results.append(res_dict)

        # Update real-time results in status
        if name_results:
            # Only keep the most recent found results in status to avoid huge JSON files
            # but enough for the frontend to show "Live" action
            JOB_STATUS["results"] = (JOB_STATUS["results"] + name_results)[-20:]

        write_results_to_output(name_results)
        save_checkpoint(filename, current_idx)

        elapsed = time.time() - start_time_run
        if elapsed >= pause_limit:
            msg = f"Pausing for {PAUSE_SECONDS}s to avoid rate limiting..."
            print(f"\n{msg}")
            update_status_error(msg)
            time.sleep(PAUSE_SECONDS)
            start_time_run = time.time()

    print(f"Finished processing {filename}.")
    JOB_STATUS["status"] = "Completed"
    JOB_STATUS["progress"] = 100
    update_status_file()

    subprocess.run(["python3", "generate_manifest.py"])
    cp_path = os.path.join(CHECKPOINT_DIR, f"{filename}.json")
    if os.path.exists(cp_path): os.remove(cp_path)

if __name__ == "__main__":
    main()
