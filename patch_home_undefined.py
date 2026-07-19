import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Fix getUserDisplayInfo
old_get_user = """  const getUserDisplayInfo = (u: any) => {
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
  };"""

new_get_user = """  const getUserDisplayInfo = (u: any) => {
    if (!u) return { name: '?', photo: '', bio: '', isSaved: false, originalName: '' };
    const saved = savedContacts.find(c => c.contactId === (u.id || u.userId));
    const isSaved = !!saved;
    const name = saved ? saved.customName : (u.phoneNumber || u.displayName || u.username || '?');
    const originalName = u.displayName || u.username;
    return {
      name,
      photo: u.profilePhoto || null,
      bio: u.bio || 'Available',
      isSaved,
      originalName
    };
  };"""

content = content.replace(old_get_user, new_get_user)

# Fix other name[0] usages
content = content.replace('.name[0].toUpperCase()', '.name?.[0]?.toUpperCase() || "?"')
content = content.replace('chat.name[0].toUpperCase()', 'chat.name?.[0]?.toUpperCase() || "?"')
content = content.replace('activeChat.name[0].toUpperCase()', 'activeChat.name?.[0]?.toUpperCase() || "?"')
content = content.replace('.username)[0].toUpperCase()', '.username)?.[0]?.toUpperCase() || "?"')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched undefined")
