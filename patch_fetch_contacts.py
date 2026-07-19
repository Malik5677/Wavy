with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

if "fetchContacts();" not in content.split("useEffect(() => {\n    if (token) {\n      fetchChats();")[1]:
    content = content.replace("fetchChats();", "fetchChats();\n      fetchContacts();")

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched fetchContacts in useEffect")
