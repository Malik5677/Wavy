with open('server.ts', 'r') as f:
    content = f.read()

send_msg_old = """    socket.on("send_message", async (data) => {
      const { chatId, content, type, replyToId } = data;
      try {
        console.log("SEND MSG DEBUG", { chatId, userId, type, contentLength: content?.length, replyToId }); 
        await ensureRoomMembership(chatId);

        const newMsg = await db.insert(messages).values({
          chatId,
          senderId: userId,
          content,
          type: type || 'text',
          replyToId: replyToId || null
        }).returning();"""

send_msg_new = """    socket.on("send_message", async (data) => {
      const { chatId, content, type, replyToId } = data;
      try {
        console.log("SEND MSG DEBUG", { chatId, userId, type, contentLength: content?.length, replyToId }); 
        await ensureRoomMembership(chatId);

        let isHidden = false;
        const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1).then(r => r[0]);
        if (chat && !chat.isGroup) {
          const members = await db.select().from(chatMembers).where(eq(chatMembers.chatId, chatId));
          const otherMember = members.find((m: any) => m.userId !== userId);
          if (otherMember) {
            const blocked = await db.select().from(blockedUsers)
              .where(and(eq(blockedUsers.blockerId, otherMember.userId), eq(blockedUsers.blockedId, userId)))
              .limit(1);
            if (blocked.length > 0) {
              isHidden = true;
            }
          }
        }

        const newMsg = await db.insert(messages).values({
          chatId,
          senderId: userId,
          content,
          type: type || 'text',
          replyToId: replyToId || null,
          isHidden
        }).returning();"""

content = content.replace(send_msg_old, send_msg_new)

# don't broadcast if isHidden
broadcast_old = """        // Broadcast to chat room
        io.to(`chat_${chatId}`).emit("receive_message", {
          ...newMsg[0],
          replyToId,
          sender: {
            name: sender?.displayName || sender?.phoneNumber
          }
        });"""

broadcast_new = """        // Broadcast to chat room
        if (!isHidden) {
          io.to(`chat_${chatId}`).emit("receive_message", {
            ...newMsg[0],
            replyToId,
            sender: {
              name: sender?.displayName || sender?.phoneNumber
            }
          });
        } else {
          // Send only to sender
          socket.emit("receive_message", {
            ...newMsg[0],
            replyToId,
            sender: {
              name: sender?.displayName || sender?.phoneNumber
            }
          });
        }"""
content = content.replace(broadcast_old, broadcast_new)


# do the same for call_offer
call_offer_old = """      const targetSockets = sockets.filter(s => s.data.userId === data.toUserId);
      
      if (targetSockets.length === 0) {"""

call_offer_new = """      // Check if blocked
      const blocked = await db.select().from(blockedUsers)
        .where(and(eq(blockedUsers.blockerId, data.toUserId), eq(blockedUsers.blockedId, userId)))
        .limit(1);
      if (blocked.length > 0) {
        // Blocked! fake offline
        socket.emit("end_call", { reason: "offline" });
        return;
      }

      const targetSockets = sockets.filter(s => s.data.userId === data.toUserId);
      
      if (targetSockets.length === 0) {"""

content = content.replace(call_offer_old, call_offer_new)

with open('server.ts', 'w') as f:
    f.write(content)
print("Patched server.ts")
