with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const [blockedUsers, setBlockedUsers] = useState<any[]>([]);' in line:
        lines.insert(i+1, '  const [savedContacts, setSavedContacts] = useState<any[]>([]);\n')
        break

fetch_contacts = """
  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedContacts(data);
      }
    } catch(e) {}
  };
"""

for i, line in enumerate(lines):
    if 'const fetchBlockedUsers = async () => {' in line:
        lines.insert(i, fetch_contacts)
        break

for i, line in enumerate(lines):
    if 'fetchChats();' in line and 'socket.on' in lines[i-1]:
        lines.insert(i+1, '    fetchContacts();\n')
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched home contacts")
