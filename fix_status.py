import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "fetch('/api/status', { headers: { Authorization: `Bearer ${token}` }})\n        .then(res => res.json())\n        .then(data => setStatuses(data))",
    "fetch('/api/status', { headers: { Authorization: `Bearer ${token}` }})\n        .then(res => { if (!res.ok) throw new Error(); return res.json(); })\n        .then(data => setStatuses(data))"
)

content = content.replace(
    "fetch('/api/status', { headers: { Authorization: `Bearer ${token}` }})\n          .then(r => r.json())\n          .then(data => setStatuses(data));",
    "fetch('/api/status', { headers: { Authorization: `Bearer ${token}` }})\n          .then(r => { if (!r.ok) throw new Error(); return r.json(); })\n          .then(data => setStatuses(data));"
)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
