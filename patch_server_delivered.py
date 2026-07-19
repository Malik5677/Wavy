with open('server.ts', 'r') as f:
    content = f.read()

# Add messages_delivered broadcast
auto_join_old = """    try {
      // Auto-join all existing chat rooms for this user
      const userChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, userId));
      userChats.forEach(chat => {
        socket.join(`chat_${chat.chatId}`);
      });
    } catch (err) {"""

auto_join_new = """    try {
      // Auto-join all existing chat rooms for this user
      const userChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, userId));
      for (const chat of userChats) {
        socket.join(`chat_${chat.chatId}`);
        try {
          await db.update(messages)
            .set({ isDelivered: true })
            .where(and(eq(messages.chatId, chat.chatId), eq(messages.isDelivered, false)));
          io.to(`chat_${chat.chatId}`).emit("messages_delivered", { chatId: chat.chatId });
        } catch(e) {}
      }
    } catch (err) {"""

content = content.replace(auto_join_old, auto_join_new)

with open('server.ts', 'w') as f:
    f.write(content)
print("Patched server.ts with auto-delivered")
