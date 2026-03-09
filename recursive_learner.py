import pandas as pd
import json
import os
from datetime import datetime

INTEL_FILE = "Data/Intelligence/Business_Intelligence.csv"
TRENDS_FILE = "Data/Intelligence/learned_trends.json"
FEEDBACK_FILE = "Data/Intelligence/Feedback_Log.csv"

def main():
    print(f"--- STARTING RECURSIVE LEARNING: {datetime.now()} ---")

    # Ensure directories exist
    os.makedirs(os.path.dirname(INTEL_FILE), exist_ok=True)

    trends = {
        "hot_industries": [],
        "market_alerts": [],
        "zip_code_momentum": {},
        "last_updated": datetime.now().isoformat()
      }

    if os.path.exists(INTEL_FILE):
        df = pd.read_csv(INTEL_FILE)

        # 1. Detect Hot Industries (most frequent in the intelligence log)
        if not df.empty and 'NAICS_Code' in df.columns:
            top_industries = df['NAICS_Code'].value_counts().head(5)
            for industry, count in top_industries.items():
                if industry != 'Pending':
                    trends["hot_industries"].append({
                        "name": industry,
                        "intensity": int(count),
                        "insight": f"Increased activity detected in {industry} vertical."
                    })

        # 2. Detect Growth Alerts (keyword scanning)
        if 'Industry_Pain_Point' in df.columns:
            growth_rows = df[df['Industry_Pain_Point'].str.contains('hiring|expansion|new site', case=False, na=False)]
            for _, row in growth_rows.tail(5).iterrows():
                trends["market_alerts"].append({
                    "business": row['Business Name'],
                    "type": "Growth Signal",
                    "detail": row['Industry_Pain_Point']
                })

    # 3. Analyze Feedback (if available) to prioritize strategies
    if os.path.exists(FEEDBACK_FILE):
        feedback_df = pd.read_csv(FEEDBACK_FILE)
        # Learning from feedback could refine what we consider a "success"
        # For now, we'll just log that we are processing it.
        print(f"  [Learning] Found {len(feedback_df)} user feedback entries.")

    # Save the learned intelligence
    with open(TRENDS_FILE, 'w') as f:
        json.dump(trends, f, indent=2)

    print(f"--- RECURSIVE LEARNING COMPLETE: {TRENDS_FILE} updated ---")

if __name__ == "__main__":
    main()
