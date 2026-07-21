with open('src/components/AdminView.tsx', 'r') as f:
    content = f.read()

# Filter users array
content = content.replace(
    'setUsers(data.users);',
    'setUsers(data.users.filter((u: any) => u.id !== currentUserId));'
)

# And use the users array for stats instead
content = content.replace(
    '<div className="text-2xl font-semibold text-[#E9EDEF]">{Math.max(0, stats.totalUsers - 1)}</div>',
    '<div className="text-2xl font-semibold text-[#E9EDEF]">{users.length}</div>'
)
content = content.replace(
    '<div className="text-2xl font-semibold text-[#E9EDEF]">{Math.max(0, stats.activeUsers - 1)}</div>',
    '<div className="text-2xl font-semibold text-[#E9EDEF]">{users.filter(u => u.isOnline).length}</div>'
)

# Replace the mapping array
content = content.replace(
    '{users.filter(u => u.id !== currentUserId).map(u => {',
    '{users.map(u => {'
)

# Replace the empty array check
content = content.replace(
    '{users.filter(u => u.id !== currentUserId).length === 0 && (',
    '{users.length === 0 && ('
)

with open('src/components/AdminView.tsx', 'w') as f:
    f.write(content)
print("Patched AdminView Stats 3")
