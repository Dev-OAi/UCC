import os
import json
import re
import shutil

def generate_manifest():
    source_data = 'Data'
    base_dir = 'public/Data'
    manifest = []

    # Ensure public/Data exists and is up to date
    if os.path.exists(source_data):
        if os.path.exists(base_dir):
            shutil.rmtree(base_dir)
        shutil.copytree(source_data, base_dir)

    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} does not exist and no {source_data} found.")
        return

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            filepath = os.path.join(root, file)
            # Relative path from public/
            relative_path = os.path.relpath(filepath, 'public')
            
            # Relative to Data/ base to extract Type and Zip
            rel_to_base = os.path.relpath(root, base_dir)
            parts = rel_to_base.split(os.sep)

            if file.endswith('.csv'):
                # Resolve data_type: use directory name, or "YP" if file starts with it, else "General"
                data_type = "General"
                zip_code = ""

                if len(parts) > 0 and parts[0] != '.':
                    data_type = parts[0]
                    if re.match(r'^\d{5}$', data_type):
                        zip_code = data_type
                elif file.startswith("YP "):
                    data_type = "YP"
                
                if len(parts) > 1:
                    zip_code = parts[1]

                # Extract location from filename if possible
                location = ""
                name_match = re.search(r'Lookup\s+(.*?)\s+-', file)
                if name_match:
                    location = name_match.group(1)
                else:
                    location = file.replace('.csv', '').replace('YP Phone Number Lookup ', '')

                manifest.append({
                    "path": relative_path,
                    "type": data_type,
                    "zip": zip_code,
                    "location": location,
                    "filename": file
                })

            elif file.endswith('.json'):
                manifest.append({
                    "path": relative_path,
                    "type": "JSON",
                    "filename": file
                })

            elif file.endswith('.pdf'):
                # Assume category is the filename without extension
                category = file.replace('.pdf', '')

                manifest.append({
                    "path": relative_path,
                    "type": "PDF",
                    "category": category,
                    "filename": file
                })

    # Sort manifest: Zip hubs first (numeric types), then others
    def sort_key(item):
        t = item.get('type', '')
        if re.match(r'^\d{5}$', t):
            return (0, t) # Zip codes first
        if t in ['1. SB', '3. UCC']:
            return (1, t) # Then SB and UCC
        if t == '2. YP':
            return (3, t) # Huge YP files last
        return (2, t) # Everything else in between

    manifest.sort(key=sort_key)

    with open('public/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated manifest with {len(manifest)} files.")

if __name__ == "__main__":
    generate_manifest()