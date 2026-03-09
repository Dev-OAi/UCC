import pandas as pd
import json
import os
from datetime import datetime, timedelta

INTEL_FILE = "Data/Intelligence/Business_Intelligence.csv"
TRENDS_FILE = "Data/Intelligence/learned_trends.json"
FEEDBACK_FILE = "Data/Intelligence/Feedback_Log.csv"
HISTORY_FILE = "Data/Intelligence/Learning_History.json"

def main():
    print(f"--- STARTING RECURSIVE LEARNING: {datetime.now()} ---")

    # Ensure directories exist
    os.makedirs(os.path.dirname(INTEL_FILE), exist_ok=True)

    # 0. Load Previous Baseline for "Self-Correction"
    old_trends = {}
    if os.path.exists(TRENDS_FILE):
        try:
            with open(TRENDS_FILE, 'r') as f:
                old_trends = json.load(f)
        except:
            pass

    trends = {
        "hot_industries": [],
        "market_alerts": [],
        "zip_code_momentum": {},
        "learning_accuracy": 0.0,
        "lender_competitive_shift": [],
        "last_updated": datetime.now().isoformat(),
        "dynamic_focus_zones": []
    }

    # 1. Detect Hot Industries (Scanning ALL hubs for volume)
    import glob
    csv_files = glob.glob("Data/**/*.csv", recursive=True)
    all_industry_counts = {}

    for f in csv_files:
        if "Business_Intelligence" in f: continue
        try:
            df_check = pd.read_csv(f, nrows=1, header=None)
            if df_check.empty: continue
            first_row = [str(x).strip() for x in df_check.iloc[0]]
            has_header = any(x in ['Name', 'COMPANY', 'businessName'] for x in first_row)

            if has_header:
                df_ind = pd.read_csv(f, usecols=lambda c: any(x in str(c) for x in ['Category', 'Industry', 'SIC']), low_memory=False)
            else:
                df_ind = pd.read_csv(f, header=None, usecols=[7] if len(df_check.columns) > 7 else [], low_memory=False)
                df_ind.columns = ['Category'] if not df_ind.empty else []

            if not df_ind.empty:
                col = df_ind.columns[0]
                counts = df_ind[col].value_counts()
                for ind, count in counts.items():
                    if str(ind) not in ['nan', 'Other', 'Other ', 'N/A', '']:
                        all_industry_counts[str(ind)] = all_industry_counts.get(str(ind), 0) + int(count)
        except:
            continue

    if all_industry_counts:
        top_industries = sorted(all_industry_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        for ind, count in top_industries:
            trends["hot_industries"].append({
                "name": ind,
                "intensity": count,
                "insight": f"Major sector presence in territory with {count} identified entities."
            })

    # 2. Detect Growth Alerts (from Recent Intelligence)
    if os.path.exists(INTEL_FILE):
        df = pd.read_csv(INTEL_FILE)
        if 'Industry_Pain_Point' in df.columns:
            growth_rows = df[df['Industry_Pain_Point'].str.contains('hiring|expansion|new site|opening|growth', case=False, na=False)]
            for _, row in growth_rows.tail(10).iterrows():
                trends["market_alerts"].append({
                    "business": row['Business Name'],
                    "type": "Growth Signal",
                    "detail": row['Industry_Pain_Point']
                })

        # 3. SELF-CORRECTION: Audit previous "Hot Industries"
        # If an industry was "Hot" in the last run, is it still growing?
        prev_hot = [h['name'] for h in old_trends.get("hot_industries", [])]
        hits = 0
        if prev_hot and not df.empty:
            for ind in prev_hot:
                # Check if new records (last 48h) still feature this industry
                # (Assuming we have a way to filter by 'Time Discovered' eventually,
                # for now we'll just check if it's still in the top 10)
                if ind in [h['name'] for h in trends["hot_industries"]]:
                    hits += 1
            trends["learning_accuracy"] = round(hits / len(prev_hot), 2) if prev_hot else 1.0

    # 4. Map Zip Code Momentum (Direct Hub Scanning)
    import glob
    csv_files = glob.glob("Data/**/*.csv", recursive=True)
    zip_counts = {}

    for f in csv_files:
        if "Business_Intelligence" in f: continue
        try:
            # Quick scan of first 1000 rows for Zips
            df_zip = pd.read_csv(f, nrows=1000, low_memory=False)
            zip_col = next((c for c in df_zip.columns if 'Zip' in str(c) or 'ZIP' in str(c)), None)

            if zip_col:
                counts = df_zip[zip_col].value_counts()
                for z, count in counts.items():
                    z_str = str(z)[:5]
                    if z_str.isdigit() and len(z_str) == 5:
                        zip_counts[z_str] = zip_counts.get(z_str, 0) + int(count)
        except:
            continue

    if zip_counts:
        top_zips = sorted(zip_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        for z, count in top_zips:
            trends["dynamic_focus_zones"].append({
                "zip": z,
                "reason": f"High density of local activity detected ({count} recent records)."
            })

    # 5. Analyze Feedback (if available) to prioritize strategies
    if os.path.exists(FEEDBACK_FILE):
        try:
            feedback_df = pd.read_csv(FEEDBACK_FILE)
            print(f"  [Learning] Found {len(feedback_df)} user feedback entries.")
            # Future: Use this to boost product recommendation weights
        except:
            pass

    # Save the learned intelligence
    with open(TRENDS_FILE, 'w') as f:
        json.dump(trends, f, indent=2)

    # Save to history for long-term trend analysis
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                history = json.load(f)
        except:
            pass

    history.append({
        "timestamp": datetime.now().isoformat(),
        "accuracy": trends["learning_accuracy"],
        "top_industry": trends["hot_industries"][0]["name"] if trends["hot_industries"] else "None"
    })

    with open(HISTORY_FILE, 'w') as f:
        json.dump(history[-50:], f, indent=2) # Keep last 50 snapshots

    print(f"--- RECURSIVE LEARNING COMPLETE: {TRENDS_FILE} updated (Accuracy: {trends['learning_accuracy']}) ---")

if __name__ == "__main__":
    main()
