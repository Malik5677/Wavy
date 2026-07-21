with open('src/components/AdminView.tsx', 'r') as f:
    content = f.read()

# Filter out current user from stats
content = content.replace(
    'const filteredUsers = users.filter(u => u.id !== currentUserId);',
    ''
) # just in case

# Let's adjust the stats display in AdminView
content = content.replace(
    '{stats.totalUsers}',
    '{Math.max(0, stats.totalUsers - 1)}'
)
content = content.replace(
    '{stats.activeUsers}',
    '{Math.max(0, stats.activeUsers - 1)}'
)

# And fix the empty state
content = content.replace(
    '{users.length === 0 && (',
    '{users.filter(u => u.id !== currentUserId).length === 0 && ('
)

with open('src/components/AdminView.tsx', 'w') as f:
    f.write(content)
print("Patched AdminView Stats")
