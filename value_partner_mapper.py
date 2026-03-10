import json
import pandas as pd
import os
import glob
from datetime import datetime

OUTPUT_GRAPH = "Data/Intelligence/Market_Graph.json"

# Industry relationship mapping (Value Chain) - This is the "Static Knowledge"
# Format: "Source Industry": [("Target Industry", "Relationship Type", "Context")]
VALUE_CHAIN = {
    "Real Estate Development": [
        ("Construction & Development", "Strategic Partner", "Primary build partner for development projects."),
        ("Abrasive Product Manufacturers", "Material Supplier", "Provides specialized finishing materials."),
        ("HVAC", "Service Provider", "Essential infrastructure installation and maintenance."),
        ("Electrical Services", "Service Provider", "Core infrastructure and lighting systems.")
    ],
    "Construction & Development": [
        ("Real Estate Development", "Customer Base", "Primary source of project contracts."),
        ("Heavy Equipment", "Equipment Supplier", "Source for machinery and site tools."),
        ("Electrical Services", "Subcontractor", "Specialized trade partner for electrical grid."),
        ("Lumber & Building Materials", "Raw Material Supplier", "Source for core structural components.")
    ],
    "Acupuncturists": [
        ("Medical Supply", "Equipment Supplier", "Source for specialized clinical needles and tools."),
        ("Wellness Centers", "Distribution Partner", "Provides referral network and shared facility space.")
    ],
    "Commercial Printing": [
        ("Graphic Design", "Upstream Partner", "Provides creative files for production."),
        ("Marketing Agencies", "Service Provider", "Fulfilment partner for regional ad campaigns."),
        ("Paper Suppliers", "Raw Material Supplier", "Core substrate source for printing volume.")
    ],
    "Apparel Manufacturers": [
        ("Textile", "Raw Material Supplier", "Provides fabric and thread for garment production."),
        ("Graphic Design", "Service Provider", "Creative partner for pattern and brand design."),
        ("Retail Bakeries", "Marketing Client", "Custom uniform and branded apron production.")
    ],
    "Accessories and Other Apparel Manufacturers": [
        ("Textile", "Raw Material Supplier", "Provides raw components for accessory manufacturing."),
        ("Retail Bakeries", "Distribution Point", "Local venue for selling branded boutique items."),
        ("Graphic Design", "Strategic Partner", "Source for custom logo and textile patterns.")
    ],
    "Trusts: Educational, Religious, Etc.": [
        ("Non-Profit Organization", "Beneficiary", "Primary recipient of trust disbursements."),
        ("Financial Services", "Strategic Advisor", "Investment and asset management partner.")
    ],
    "Retail Bakeries": [
        ("Apparel Manufacturers", "Branding Partner", "Source for custom branded uniforms and aprons."),
        ("Paper Suppliers", "Packaging Supplier", "Source for boxes, bags, and food-grade wraps."),
        ("Graphic Design", "Marketing Partner", "Creative source for menus and signage.")
    ]
}

def main():
    print(f"--- STARTING VALUE PARTNER MAPPING: {datetime.now()} ---")

    graph = {
        "connections": [],
        "strategic_referrals": [],
        "last_updated": datetime.now().isoformat()
    }

    # Load recent business names and their categories
    all_businesses = {}

    # Scan Data for leads
    csv_files = glob.glob("Data/**/*.csv", recursive=True)
    for f in csv_files:
        if "Business_Intelligence" in f: continue
        try:
            # Check for headers
            df_check = pd.read_csv(f, nrows=1, header=None)
            if df_check.empty: continue

            first_row = [str(x).strip() for x in df_check.iloc[0]]
            has_header = any(x in ['Name', 'COMPANY', 'businessName', 'Entity Name'] for x in first_row)

            if has_header:
                df = pd.read_csv(f, nrows=500, low_memory=False)
                name_col = next((c for c in df.columns if any(x in str(c) for x in ['Name', 'COMPANY', 'businessName'])), None)
                cat_col = next((c for c in df.columns if any(x in str(c) for x in ['Category', 'Industry', 'SIC', 'SICDESC'])), None)
            else:
                # Fallback for ZIP hubs (No header)
                df = pd.read_csv(f, header=None, nrows=500, low_memory=False)
                name_col = 0
                cat_col = None
                # Check column 7 (YP/33027 format)
                if len(df.columns) > 7:
                    sample = str(df.iloc[0, 7])
                    if not sample.startswith('http') and len(sample) > 3:
                        cat_col = 7

            if name_col is not None:
                for _, row in df.iterrows():
                    name = str(row[name_col]).strip().upper()
                    cat = str(row[cat_col]).strip() if cat_col is not None else 'Other'
                    if name and name != 'NAN' and name != 'N/A':
                        all_businesses[name] = cat
        except:
            continue

    # Map Mutual Value Connections
    processed = set()
    for biz_a, cat_a in all_businesses.items():
        if cat_a in VALUE_CHAIN:
            targets = VALUE_CHAIN[cat_a]
            for biz_b, cat_b in all_businesses.items():
                if biz_a == biz_b: continue

                for target_cat, rel_type, context in targets:
                    if target_cat in cat_b:
                        connection_id = "-".join(sorted([biz_a, biz_b]))
                        if connection_id not in processed:
                            # 1. Add connection for Graph UI
                            graph["connections"].append({
                                "source": biz_a,
                                "source_cat": cat_a,
                                "target": biz_b,
                                "target_cat": cat_b,
                                "rel_type": rel_type,
                                "reason": f"{rel_type}: {context}"
                            })

                            # 2. Add as Strategic Referral Idea for the Banker
                            graph["strategic_referrals"].append({
                                "primary": biz_a,
                                "primary_industry": cat_a,
                                "partner": biz_b,
                                "partner_industry": cat_b,
                                "rel_type": rel_type,
                                "referral_script": f"I noticed you are in {cat_a}. We just started working with {biz_b} (a {cat_b} {rel_type.lower()})—would an introduction to help optimize your business be helpful?"
                            })

                        processed.add(connection_id)
                        if len(processed) > 50: break # Limiting for efficiency
        if len(processed) > 50: break

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_GRAPH), exist_ok=True)
    with open(OUTPUT_GRAPH, 'w') as f:
        json.dump(graph, f, indent=2)

    print(f"--- VALUE MAPPING COMPLETE: {len(graph['connections'])} connections and referrals discovered ---")

if __name__ == "__main__":
    main()
