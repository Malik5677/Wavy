with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{msg.sender?.name ? msg.sender.name[0].toUpperCase() : \'U\'}' in line:
        lines[i] = '                        {getUserDisplayInfo({ id: msg.senderId, displayName: msg.senderName, phoneNumber: msg.senderPhone }).name[0]?.toUpperCase() || \'U\'}\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched msg avatar")
