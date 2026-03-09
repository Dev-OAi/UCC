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

    if os.path.exists(INTEL_FILE):
        df = pd.read_csv(INTEL_FILE)

        # 1. Detect Hot Industries (most frequent in the intelligence log)
        if not df.empty and 'NAICS_Code' in df.columns:
            top_industries = df['NAICS_Code'].value_counts().head(8)
            for industry, count in top_industries.items():
                if industry != 'Pending' and str(industry) != 'nan':
                    trends["hot_industries"].append({
                        "name": str(industry),
                        "intensity": int(count),
                        "insight": f"Increased activity detected in {industry} vertical."
                    })

        # 2. Detect Growth Alerts (keyword scanning)
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

    # 4. Map Zip Code Momentum (Mocking for now based on Business Intelligence logs)
    # In a real scenario, we'd use the actual Hub CSVs
    # We'll pull a few "Focus Zones" based on where most intelligence is being gathered
    if os.path.exists(INTEL_FILE):
        # If we had a Zip column in INTEL_FILE, we'd use it.
        # For now, let's suggest focus zones based on industry clusters
        trends["dynamic_focus_zones"] = [
            {"zip": "33401", "reason": "High density of Real Estate growth signals."},
            {"zip": "33477", "reason": "New construction activity hotspot."}
        ]

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
