with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));',
    'await db.update(messages).set({ isRead: true, isDelivered: true }).where(eq(messages.id, messageId));'
)

with open('server.ts', 'w') as f:
    f.write(content)
print("Patched server.ts message_read")
