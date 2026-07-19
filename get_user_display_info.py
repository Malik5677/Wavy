with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

helper = """
  const getUserDisplayInfo = (u: any) => {
    if (!u) return { name: '', photo: '', bio: '', isSaved: false, originalName: '' };
    const saved = savedContacts.find(c => c.contactId === (u.id || u.userId));
    const isSaved = !!saved;
    const name = saved ? saved.customName : u.phoneNumber;
    const originalName = u.displayName || u.username;
    return {
      name,
      photo: u.profilePhoto || null,
      bio: u.bio || 'Available',
      isSaved,
      originalName
    };
  };
"""

for i, line in enumerate(lines):
    if 'const searchUsers = async (q: string) => {' in line:
        lines.insert(i, helper)
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Added getUserDisplayInfo")
