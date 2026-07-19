import re

with open('src/server/chat.ts', 'r') as f:
    content = f.read()

# Remove the block:
#     // Mark unread messages sent by others as read
#     const unreadMessages = ...
#     if (unreadMessages.length > 0) { ... }
#
block_pattern = r"// Mark unread messages sent by others as read\s*const unreadMessages = chatMsgs\.filter\(m => !m\.isRead && m\.senderId !== userId\);\s*if \(unreadMessages\.length > 0\) \{.*?\n\s*\}"

content = re.sub(block_pattern, "", content, flags=re.DOTALL)

with open('src/server/chat.ts', 'w') as f:
    f.write(content)
print("Patched chat.ts (removed bulk read)")
