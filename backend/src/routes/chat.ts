import { Router } from 'express';
import { db } from '../db';
import { blockedUsers, users, chats, chatMembers, messages, starredMessages } from '../db/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import { authenticate } from '../middleware';
import { applyPrivacyFilters } from '../utils/privacy';

export const chatRouter = Router();

chatRouter.use(authenticate);

const isUserChatMember = async (userId: string, chatId: string) => {
  const member = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId))).limit(1);
  return member.length > 0;
};

const getMessageDetails = async (messageId: string) => {
  const msg = await db.select({ senderId: messages.senderId, chatId: messages.chatId }).from(messages).where(eq(messages.id, messageId)).limit(1);
  return msg[0] ?? null;
};

const isMessageOwner = async (messageId: string, userId: string) => {
  const msg = await getMessageDetails(messageId);
  if (!msg) return null;
  return msg.senderId === userId ? msg : null;
};

const isMessageInChat = async (messageId: string, chatId: string) => {
  const msg = await getMessageDetails(messageId);
  return msg?.chatId === chatId;
};

// Get all chats for the user
chatRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    // Basic join to get chats and members
    const userChats = await db.select({
      chatId: chats.id,
      isGroup: chats.isGroup,
      name: chats.name,
      avatar: chats.avatar,
      description: chats.description,
      updatedAt: chats.updatedAt,
      isPinned: chatMembers.isPinned,
      isArchived: chatMembers.isArchived,
    })
    .from(chatMembers)
    .innerJoin(chats, eq(chatMembers.chatId, chats.id))
    .where(eq(chatMembers.userId, userId))
    .orderBy(desc(chats.updatedAt));

    // Get other members for 1-on-1 chats
    const formattedChats = await Promise.all(userChats.map(async (chat) => {
      let chatName = chat.name;
      let chatAvatar = chat.avatar;
      let otherUser = null;
      
      if (!chat.isGroup) {
        const members = await db.select({
          user: users
        })
        .from(chatMembers)
        .innerJoin(users, eq(chatMembers.userId, users.id))
        .where(eq(chatMembers.chatId, chat.chatId));
        
        const otherMember = members.find(m => m.user.id !== userId);
        if (otherMember) {
          otherUser = otherMember.user;
          chatName = otherMember.user.displayName || otherMember.user.phoneNumber;
          chatAvatar = otherMember.user.profilePhoto;
        }
      }

      if (otherUser) {
        // Check if we are blocked by the other user
        const amIBlocked = await db.select().from(blockedUsers)
          .where(and(eq(blockedUsers.blockerId, otherUser.id), eq(blockedUsers.blockedId, userId)))
          .limit(1);
          
        const isBlocked = amIBlocked.length > 0;
        
        if (isBlocked) {
           otherUser.profilePhoto = null;
           chatAvatar = null;
           otherUser.isOnline = false;
           otherUser.lastSeen = null;
           otherUser.bio = null;
        } else {
           if (otherUser.privacyProfilePhoto === 'nobody') {
             otherUser.profilePhoto = null;
             chatAvatar = null;
           }
           if (otherUser.privacyLastSeen === 'nobody') {
             otherUser.isOnline = false;
             otherUser.lastSeen = null;
           }
           if (otherUser.privacyStatus === 'nobody') {
             otherUser.bio = null;
           }
        }
      }

      // Get last message
      const lastMessageArr = await db.select()
        .from(messages)
        .where(eq(messages.chatId, chat.chatId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      return {
        ...chat,
        name: chatName,
        avatar: chatAvatar,
        otherUser,
        lastMessage: lastMessageArr[0] || null
      };
    }));

    res.json(formattedChats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Search users to start chat
const normalizePhoneSearch = (value: string) => {
  return value.replace(/[^0-9]/g, '').slice(-10);
};

chatRouter.get('/search-users', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query.trim()) return res.json([]);

  const searchDigits = normalizePhoneSearch(query);
  const lowerQuery = query.toLowerCase();

  try {
    const result = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      displayName: users.displayName,
      username: users.username,
      profilePhoto: users.profilePhoto,
    }).from(users);

    const filtered = result.filter(u => {
      if (u.id === req.user.id) return false;
      const matchesPhone = searchDigits.length === 10 && u.phoneNumber?.includes(searchDigits);
      const matchesName = u.displayName?.toLowerCase().includes(lowerQuery);
      const matchesEmail = u.username?.toLowerCase().includes(lowerQuery);
      return Boolean(matchesPhone || matchesName || matchesEmail);
    });

    const visibleUsers = await Promise.all(filtered.map(async (u) => await applyPrivacyFilters(u, req.user.id)));
    res.json(visibleUsers.slice(0, 20));
  } catch(err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

chatRouter.get('/starred', async (req, res) => {
  const userId = req.user.id;
  try {
    const starredRows = await db.select({
      id: messages.id,
      chatId: messages.chatId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      createdAt: messages.createdAt,
      isDeleted: messages.isDeleted,
      isHidden: messages.isHidden,
      reaction: messages.reaction,
      replyToId: messages.replyToId,
      senderName: users.displayName,
      senderPhone: users.phoneNumber,
    })
      .from(messages)
      .innerJoin(starredMessages, eq(starredMessages.messageId, messages.id))
      .innerJoin(chatMembers, and(eq(chatMembers.chatId, messages.chatId), eq(chatMembers.userId, userId)))
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(starredMessages.userId, userId))
      .orderBy(desc(messages.createdAt));

    res.json(starredRows.map((row) => ({
      ...row,
      isStarred: true,
      sender: {
        name: row.senderName || row.senderPhone
      }
    })));
  } catch (err) {
    console.error('Failed to fetch starred messages', err);
    res.status(500).json({ error: 'Failed to fetch starred messages' });
  }
});

// Start a 1-on-1 chat
chatRouter.post('/start', async (req, res) => {
  const { recipientId } = req.body;
  const userId = req.user.id;
  
  try {
    // Check if chat already exists
    // This requires a more complex query, for simplicity we'll just check if there's a chat with exactly these 2 members
    // In production, we'd use a better raw query for this.
    
    const myChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, userId));
    const recipientChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, recipientId));
    
    const myChatIds = myChats.map(c => c.chatId);
    const recipientChatIds = recipientChats.map(c => c.chatId);
    
    const commonChatIds = myChatIds.filter(id => recipientChatIds.includes(id));
    
    for (const id of commonChatIds) {
      // Find if it's a 1-on-1
      const chat = await db.select().from(chats).where(and(eq(chats.id, id), eq(chats.isGroup, false))).limit(1);
      if (chat.length > 0) {
        return res.json({ chatId: id });
      }
    }

    // Create new chat
    const newChat = await db.insert(chats).values({
      isGroup: false,
    }).returning();
    
    await db.insert(chatMembers).values([
      { chatId: newChat[0].id, userId: userId },
      { chatId: newChat[0].id, userId: recipientId }
    ]);

    res.json({ chatId: newChat[0].id });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : 'Unknown error';
    console.error('START CHAT ERROR:', err);
    res.status(500).json({ error: 'Failed to start chat', details });
  }
});

// Create a group chat
chatRouter.post('/group', async (req, res) => {
  const { name, memberIds, description, avatar } = req.body;
  const userId = req.user.id;
  
  if (!name || !memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ error: 'Name and memberIds required' });
  }

  try {
    const newChat = await db.insert(chats).values({
      isGroup: true,
      name,
      description,
      avatar,
    }).returning();

    const chatId = newChat[0].id;
    
    const membersToInsert = [
      { chatId, userId, role: 'admin' },
      ...memberIds.map(id => ({ chatId, userId: id, role: 'member' }))
    ];

    await db.insert(chatMembers).values(membersToInsert);

    res.json({ chatId, ...newChat[0] });
  } catch(err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

chatRouter.put('/:chatId/messages/:messageId/star', async (req, res) => {
  const { chatId, messageId } = req.params;
  const userId = req.user.id;

  try {
    if (!await isUserChatMember(userId, chatId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!await isMessageInChat(messageId, chatId)) {
      return res.status(400).json({ error: 'Message not found in chat' });
    }

    const existing = await db.select().from(starredMessages)
      .where(and(eq(starredMessages.userId, userId), eq(starredMessages.messageId, messageId)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(starredMessages).values({ userId, messageId });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to star message', err);
    res.status(500).json({ error: 'Failed to star message' });
  }
});

chatRouter.delete('/:chatId/messages/:messageId/star', async (req, res) => {
  const { chatId, messageId } = req.params;
  const userId = req.user.id;

  try {
    if (!await isUserChatMember(userId, chatId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!await isMessageInChat(messageId, chatId)) {
      return res.status(400).json({ error: 'Message not found in chat' });
    }
    await db.delete(starredMessages)
      .where(and(eq(starredMessages.userId, userId), eq(starredMessages.messageId, messageId)));
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to unstar message', err);
    res.status(500).json({ error: 'Failed to unstar message' });
  }
});

// Get messages for a chat
chatRouter.get('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = (req.query.search as string || '').trim().toLowerCase();

  const hasColumn = async (tableName: string, columnName: string) => {
    const result: any = await db.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = ${tableName} AND column_name = ${columnName}
      LIMIT 1
    `);
    return Array.isArray(result?.rows) ? result.rows.length > 0 : !!result?.rowCount;
  };

  const hasTable = async (tableName: string) => {
    const result: any = await db.execute(sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = ${tableName}
      LIMIT 1
    `);
    return Array.isArray(result?.rows) ? result.rows.length > 0 : !!result?.rowCount;
  };

  try {
    if (!await isUserChatMember(userId, chatId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const hasIsHidden = await hasColumn('messages', 'is_hidden');
    const hasIsDeleted = await hasColumn('messages', 'is_deleted');
    const hasReaction = await hasColumn('messages', 'reaction');
    const hasReplyToId = await hasColumn('messages', 'reply_to_id');
    const hasStarredMessages = await hasTable('starred_messages');

    const selectFields: any = {
      id: messages.id,
      chatId: messages.chatId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      isRead: messages.isRead,
      isDelivered: messages.isDelivered,
      createdAt: messages.createdAt,
      senderName: users.displayName,
      senderPhone: users.phoneNumber,
      isDeleted: hasIsDeleted ? messages.isDeleted : sql`false`,
      isHidden: hasIsHidden ? messages.isHidden : sql`false`,
      reaction: hasReaction ? messages.reaction : sql`NULL`,
      replyToId: hasReplyToId ? messages.replyToId : sql`NULL`,
      isStarred: hasStarredMessages ? sql`CASE WHEN ${starredMessages.id} IS NULL THEN false ELSE true END` : sql`false`
    };

    let messageQuery: any = db.select(selectFields)
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id));

    if (hasStarredMessages) {
      messageQuery = messageQuery.leftJoin(
        starredMessages,
        and(eq(starredMessages.messageId, messages.id), eq(starredMessages.userId, userId))
      );
    }

    if (hasIsHidden) {
      messageQuery = messageQuery.where(and(
        eq(messages.chatId, chatId),
        or(
          eq(messages.isHidden, false),
          eq(messages.senderId, userId)
        )
      ));
    } else {
      messageQuery = messageQuery.where(eq(messages.chatId, chatId));
    }

    const chatMsgsRaw = await messageQuery
      .orderBy(desc(messages.createdAt))
      .limit(50)
      .offset(offset);

    // We reverse because we fetched newest 50, but UI needs oldest to newest (top to bottom)
    chatMsgsRaw.reverse();

    const chatMsgs = chatMsgsRaw
      .map((m: any) => ({
        ...m,
        sender: {
          name: m.senderName || m.senderPhone
        }
      }))
      .filter((m: any) => !search || (m.content && m.content.toLowerCase().includes(search)));

    res.json(chatMsgs);
  } catch (err) {
    console.error("❌ FETCH MESSAGES ERROR:", err);

    res.status(500).json({
      error: "Failed to fetch messages",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Add member to group
chatRouter.post('/:chatId/members', async (req, res) => {
  const { chatId } = req.params;
  const { userId, role } = req.body;
  const myUserId = req.user.id;
  try {
    const myRole = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, myUserId))).limit(1);
    if (!myRole[0] || myRole[0].role !== 'admin') return res.status(403).json({ error: 'Not an admin' });
    await db.insert(chatMembers).values({ chatId, userId, role: role || 'member' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to add member' }); }
});

// Remove member from group
chatRouter.delete('/:chatId/members/:userId', async (req, res) => {
  const { chatId, userId } = req.params;
  const myUserId = req.user.id;
  try {
    const myRole = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, myUserId))).limit(1);
    if (!myRole[0] || myRole[0].role !== 'admin') return res.status(403).json({ error: 'Not an admin' });
    await db.delete(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to remove member' }); }
});

// Update group info
chatRouter.put('/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const { name, description, avatar } = req.body;
  const myUserId = req.user.id;
  try {
    const myRole = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, myUserId))).limit(1);
    if (!myRole[0] || myRole[0].role !== 'admin') return res.status(403).json({ error: 'Not an admin' });
    await db.update(chats).set({ name, description, avatar }).where(eq(chats.id, chatId));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to update group' }); }
});

// Toggle pinned status
chatRouter.put('/:chatId/pin', async (req, res) => {
  const { chatId } = req.params;
  const { isPinned } = req.body;
  const userId = req.user.id;
  try {
    await db.update(chatMembers).set({ isPinned }).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to pin chat' }); }
});

// Toggle archived status
chatRouter.put('/:chatId/archive', async (req, res) => {
  const { chatId } = req.params;
  const { isArchived } = req.body;
  const userId = req.user.id;
  try {
    await db.update(chatMembers).set({ isArchived }).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to archive chat' }); }
});

chatRouter.delete('/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  try {
    const member = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId))).limit(1).then(r => r[0]);
    if (!member) return res.status(403).json({ error: 'Not a member' });
    
    // For simplicity, we delete the chat completely if it's a DM, or just leave if it's a group.
    // Let's just delete the chat member for this user to "delete" it from their view.
    await db.delete(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

chatRouter.delete('/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  try {
    const member = await db.select().from(chatMembers).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId))).limit(1).then(r => r[0]);
    if (!member) return res.status(403).json({ error: 'Not a member' });
    
    // Clear messages for everyone in this simple implementation, or just simulate it.
    await db.delete(messages).where(eq(messages.chatId, chatId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});
