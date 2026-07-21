with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{!isMe && <p className="text-[11px] font-bold text-orange-600 mb-0.5">{msg.sender?.name || \'User\'}</p>}' in line:
        lines[i] = '                          {!isMe && <p className="text-[11px] font-bold text-orange-600 mb-0.5">{getUserDisplayInfo({ id: msg.senderId, displayName: msg.senderName, phoneNumber: msg.senderPhone }).name || \'User\'}</p>}\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched msg sender name")
