with open('src/server/chat.ts', 'r') as f:
    content = f.read()

# Add isHidden to select
content = content.replace(
    'isDeleted: messages.isDeleted,',
    'isDeleted: messages.isDeleted,\n      isHidden: messages.isHidden,'
)

# Add filter condition
filter_old = """    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))"""

filter_new = """    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(
      eq(messages.chatId, chatId),
      or(
        eq(messages.isHidden, false),
        eq(messages.senderId, userId)
      )
    ))
    .orderBy(desc(messages.createdAt))"""
content = content.replace(filter_old, filter_new)

with open('src/server/chat.ts', 'w') as f:
    f.write(content)
print("Patched chat.ts")
