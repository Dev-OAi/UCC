import re
from collections import Counter

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Check for duplicate imports
    imports = re.findall(r'import\s+{\s*([^}]+)\s*}\s+from', content)
    for imp_group in imports:
        names = [n.strip() for n in imp_group.split(',')]
        counts = Counter(names)
        dups = [name for name, count in counts.items() if count > 1]
        if dups:
            print(f"Duplicate imports in {filepath}: {dups}")

    # 2. Check for duplicate top-level declarations
    declarations = re.findall(r'^(?:export\s+)?(?:const|let|var|function|interface|type)\s+([a-zA-Z0-9_]+)', content, re.MULTILINE)
    counts = Counter(declarations)
    dups = [name for name, count in counts.items() if count > 1]
    if dups:
        print(f"Duplicate top-level declarations in {filepath}: {dups}")

    # 3. Check for duplicate declarations inside the component
    # This is harder to parse correctly with regex, but let's try a simple version
    comp_match = re.search(r'export const UCCAutomation.*?\n};', content, re.DOTALL)
    if comp_match:
        comp_content = comp_match.group(0)
        inner_declarations = re.findall(r'(?:const|let|var|function)\s+([a-zA-Z0-9_]+)\s*(?:=||\()', comp_content)
        # Filter out common React patterns if needed, but let's see
        # We only care about things in the SAME scope.
        # This regex will catch EVERYTHING inside.

check_file('src/components/UCCAutomation.tsx')
