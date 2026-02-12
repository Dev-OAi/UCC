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
            if file.endswith('.csv'):
                filepath = os.path.join(root, file)
                # Relative path from public/
                relative_path = os.path.relpath(filepath, 'public')

                # Try to extract info from path
                # public/Data/<Type>/<Zip>/<Filename>
                rel_to_base = os.path.relpath(root, base_dir)
                parts = rel_to_base.split(os.sep)

                data_type = parts[0] if len(parts) > 0 and parts[0] != '.' else ("YP" if file.startswith("YP ") else "General")
                zip_code = parts[1] if len(parts) > 1 else ""

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

    with open('public/manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated manifest with {len(manifest)} files.")

if __name__ == "__main__":
    generate_manifest()
