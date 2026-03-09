import json
import pandas as pd
import os
import glob
from datetime import datetime

OUTPUT_GRAPH = "Data/Intelligence/Market_Graph.json"

# Industry relationship mapping (Value Chain)
VALUE_CHAIN = {
    "Real Estate Development": ["Construction & Development", "Abrasive Product Manufacturers", "HVAC"],
    "Construction & Development": ["Real Estate Development", "Heavy Equipment", "Electrical Services"],
    "Acupuncturists": ["Medical Supply", "Wellness Centers"],
    "Commercial Printing": ["Graphic Design", "Marketing Agencies", "Paper Suppliers"]
}

def main():
    print(f"--- STARTING VALUE PARTNER MAPPING: {datetime.now()} ---")

    graph = {
        "connections": [],
        "last_updated": datetime.now().isoformat()
    }

    # Load recent business names and their categories
    all_businesses = {}

    # Scan Data for leads
    csv_files = glob.glob("Data/**/*.csv", recursive=True)
    for f in csv_files:
        if "Business_Intelligence" in f: continue
        try:
            df = pd.read_csv(f, nrows=500, low_memory=False)
            # Find name and category columns
            name_col = next((c for c in df.columns if 'Name' in c or 'COMPANY' in c), None)
            cat_col = next((c for c in df.columns if 'Category' in c or 'Industry' in c), None)

            if name_col and cat_col:
                for _, row in df.iterrows():
                    name = str(row[name_col]).strip().upper()
                    cat = str(row[cat_col]).strip()
                    if name and cat and name != 'NAN' and cat != 'NAN':
                        all_businesses[name] = cat
        except:
            continue

    # Map Mutual Value
    processed = set()
    for biz_a, cat_a in all_businesses.items():
        if cat_a in VALUE_CHAIN:
            targets = VALUE_CHAIN[cat_a]
            for biz_b, cat_b in all_businesses.items():
                if biz_a == biz_b: continue

                if any(t in cat_b for t in targets):
                    connection_id = "-".join(sorted([biz_a, biz_b]))
                    if connection_id not in processed:
                        graph["connections"].append({
                            "source": biz_a,
                            "source_cat": cat_a,
                            "target": biz_b,
                            "target_cat": cat_b,
                            "reason": f"{cat_a} firms like {biz_a} often utilize services from {cat_b} firms like {biz_b}."
                        })
                        processed.add(connection_id)
                        if len(processed) > 100: break
        if len(processed) > 100: break

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_GRAPH), exist_ok=True)
    with open(OUTPUT_GRAPH, 'w') as f:
        json.dump(graph, f, indent=2)

    print(f"--- VALUE MAPPING COMPLETE: {len(graph['connections'])} connections discovered ---")

if __name__ == "__main__":
    main()
