import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# We want to replace `if (res.ok) { const data = await res.json();` with `if (res.ok && res.headers.get('content-type')?.includes('application/json')) { const data = await res.json();`

content = content.replace("if (res.ok) {\n        const data = await res.json();", "if (res.ok && res.headers.get('content-type')?.includes('application/json')) {\n        const data = await res.json();")

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched")
