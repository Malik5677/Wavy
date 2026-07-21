with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

save_contact_fn = """  const saveContact = async (contactId: string, customName: string) => {
    try {
      const res = await fetch('/api/user/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactId, customName })
      });
      if (res.ok) {
        toast.success("Contact saved");
        fetchContacts();
      }
    } catch(e) {
      toast.error("Failed to save contact");
    }
  };
"""

for i, line in enumerate(lines):
    if 'const fetchContacts = async () => {' in line:
        lines.insert(i, save_contact_fn)
        break

for i, line in enumerate(lines):
    if '<p className="text-[17px] text-[#E9EDEF]">{activeChat.otherUser.bio || \'Available\'}</p>' in line:
        lines.insert(i+2, """                {!getUserDisplayInfo(activeChat.otherUser).isSaved && (
                  <button onClick={() => {
                    const customName = prompt('Enter a name for this contact:', activeChat.otherUser.displayName || '');
                    if (customName) saveContact(activeChat.otherUser.id, customName);
                  }} className="mt-4 flex items-center justify-center gap-2 bg-[#202C33] hover:bg-[#374045] text-[#E9EDEF] py-2 px-4 rounded-lg transition font-medium">
                    <UserIcon size={18} /> Add to contacts
                  </button>
                )}\n""")
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched save contact")
