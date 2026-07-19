with open('src/server/chat.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'isRead: messages.isRead,',
    'isRead: messages.isRead,\n      isDelivered: messages.isDelivered,'
)

with open('src/server/chat.ts', 'w') as f:
    f.write(content)
print("Fixed select")
