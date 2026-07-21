import re

with open('src/components/AdminView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'export function AdminView({ token }: { token: string }) {',
    'export function AdminView({ token, currentUserId, savedContacts = [] }: { token: string, currentUserId?: string, savedContacts?: any[] }) {'
)

content = content.replace(
    '{users.map(u => (',
    '{users.filter(u => u.id !== currentUserId).map(u => {\n                  const saved = savedContacts.find(c => c.contactId === u.id);\n                  const mainName = saved ? saved.customName : (u.phoneNumber || u.displayName || \'Unknown\');\n                  return ('
)

content = content.replace(
    '<div className="font-medium text-[#E9EDEF] truncate text-sm">{u.displayName || \'Unknown\'}</div>',
    '<div className="font-medium text-[#E9EDEF] truncate text-sm">{mainName}</div>\n                      {saved && u.phoneNumber && <div className="text-xs text-[#8696A0] truncate">{u.phoneNumber}</div>}'
)

content = content.replace('                  </div>\n                ))}', '                  </div>\n                );})}')

with open('src/components/AdminView.tsx', 'w') as f:
    f.write(content)
print("Patched AdminView")
