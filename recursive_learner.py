import pandas as pd
import json
import os
from datetime import datetime

OUTCOME_FILE = "Data/Intelligence/Outcome_Log.json"
LEARNED_INSIGHTS_FILE = "Data/Intelligence/Learned_Insights.json"
TRENDS_FILE = "Data/Intelligence/learned_trends.json"

def main():
    print(f"--- STARTING OUTCOME-DRIVEN RECURSIVE LEARNING: {datetime.now()} ---")

    insights = {
        "winning_industries": [],
        "hot_zips": [],
        "conversion_triggers": [],
        "last_learned": datetime.now().isoformat()
    }

    # 1. Load User Feedback / Outcomes
    if os.path.exists(OUTCOME_FILE):
        try:
            with open(OUTCOME_FILE, 'r') as f:
                outcomes = json.load(f)

            # Analyze "Appointment Set" and "Contracted" leads
            df = pd.DataFrame(outcomes)
            if not df.empty:
                # Filter for successful outcomes
                success_df = df[df['status'].isin(['APPOINTMENT_SET', 'CONTACTED'])]

                if not success_df.empty:
                    # Learn winning industries
                    ind_counts = success_df['industry'].value_counts()
                    for ind, count in ind_counts.items():
                        insights["winning_industries"].append({
                            "industry": ind,
                            "weight": round(count / len(success_df), 2)
                        })

                    # Learn hot zip codes
                    zip_counts = success_df['zip'].value_counts()
                    for z, count in zip_counts.items():
                        insights["hot_zips"].append({
                            "zip": str(z),
                            "momentum": round(count / len(success_df), 2)
                        })

                    # Look for common trigger patterns in notes
                    all_notes = " ".join(success_df['activities'].apply(lambda x: " ".join([a.get('notes', '') for a in x])).tolist()).lower()
                    triggers = ['expansion', 'hiring', 'loan', 'credit', 'payroll', 'new site', 'building']
                    for t in triggers:
                        if t in all_notes:
                            insights["conversion_triggers"].append(t)
        except Exception as e:
            print(f"Error analyzing outcomes: {e}")

    # 2. Update the Learned Insights file
    with open(LEARNED_INSIGHTS_FILE, 'w') as f:
        json.dump(insights, f, indent=2)

    # 3. Trigger standard trend discovery (legacy/volume based)
    # We could combine them, but for now we'll keep the script focused.
    print(f"Learned Insights Saved to {LEARNED_INSIGHTS_FILE}")

if __name__ == "__main__":
    main()
