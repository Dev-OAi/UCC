import re

with open('src/components/UCCAutomation.tsx', 'r') as f:
    content = f.read()

# Look for variable/function declarations inside the component
declarations = re.findall(r'(?:const|let|var|function)\s+([a-zA-Z0-9_]+)\s*(?:=||\()', content)
counts = {}
for d in declarations:
    counts[d] = counts.get(d, 0) + 1

duplicates = {name: count for name, count in counts.items() if count > 1}
if duplicates:
    print("Found duplicate declarations:", duplicates)
else:
    print("No duplicate declarations found.")
