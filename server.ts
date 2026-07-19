import dotenv from "dotenv";
dotenv.config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);
import express from "express";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { authRouter } from "./src/server/auth";
import { authenticate } from "./src/server/middleware";
import { chatRouter } from "./src/server/chat";
import { userRouter } from "./src/server/user";
import { communityRouter } from "./src/server/community";
import { adminRouter } from "./src/server/admin";
import { statusRouter } from "./src/server/status";
import { callRouter } from "./src/server/call";
import jwt from "jsonwebtoken";
import { db } from "./src/db";
import { blockedUsers, users, messages, chats, chatMembers } from "./src/db/schema";
import { eq, and } from "drizzle-orm";


async function startServer() {
  console.log("DATABASE_URL IS:", process.env.DATABASE_URL);
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Basic middleware
  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled for dev with Vite
  app.use(express.json({ limit: "50mb" }));
  app.use(cookieParser());

  // Rate limiting setup
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }, validate: { xForwardedForHeader: false, default: true }
  });
  
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 login/auth requests per hour
    message: { error: 'Too many authentication attempts, please try again later.' }, validate: { xForwardedForHeader: false, default: true }
  });

  app.use("/api/", apiLimiter);
  app.use("/api/auth/", authLimiter);


  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 10 * 1024 * 1024 // 10MB
  });

  // Simple auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wavechat-super-secret-key') as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch(err) {
      next(new Error('Authentication error'));
    }
  });

  // Socket.IO Events
  const ensureRoomMembership = async (chatId: string) => {
    try {
      const members = await db.select({ userId: chatMembers.userId }).from(chatMembers).where(eq(chatMembers.chatId, chatId));
      const connectedSockets = await io.fetchSockets();
      members.forEach(member => {
        const mSockets = connectedSockets.filter(s => s.data.userId === member.userId);
        mSockets.forEach(s => s.join(`chat_${chatId}`));
      });
    } catch(err) {
      console.error("Error ensuring room membership", err);
    }
  };

  io.on("connection", async (socket) => {
    console.log("User connected", socket.data.userId);
    const userId = socket.data.userId;
    
    // Join personal room for notifications
    socket.join(userId);

    try {
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
    } catch (err) {
      console.error("Failed to auto-join chat rooms", err);
    }

    // Set online status
    socket.join(`user_presence_${userId}`);
    try {
      await db.update(users).set({ isOnline: true, lastSeen: new Date() }).where(eq(users.id, userId));
      io.emit("user_status", { userId, isOnline: true, lastSeen: new Date() });
    } catch (e) {
      console.error("Failed to set online status", e);
    }

  socket.on("join_chat", async (chatId) => {
  console.log("JOIN ROOM", socket.data.userId, chatId);

  await socket.join(`chat_${chatId}`);

  console.log(socket.rooms);
});

    socket.on("send_message", async (data) => {
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
const newMsg = await db
  .insert(messages)
  .values({
    chatId,
    senderId: userId,
    content,
    type: type || "text",
    replyToId: replyToId || null,
    isHidden,
  })
  .returning();

console.log("✅ MESSAGE SAVED", newMsg[0]);
console.log("Sending to room:", `chat_${chatId}`);
console.log("Rooms:", io.sockets.adapter.rooms.get(`chat_${chatId}`));
        // Get sender details
        const sender = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);

        // Update chat updatedAt
        await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

        // Broadcast to chat room
        if (!isHidden) {
          console.log("📤 EMITTING TO ROOM", `chat_${chatId}`);
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
        }
      } catch (err: any) {
        console.error("Failed to send message", err);
        socket.emit("send_message_error", { error: err.message, stack: err.stack });
      }
    });

    socket.on("edit_message", async (data) => {
      const { messageId, chatId, content } = data;
      try {
        await db.update(messages).set({ content }).where(eq(messages.id, messageId));
        io.to(`chat_${chatId}`).emit("message_edited", { messageId, content });
      } catch (err) {
        console.error("Failed to edit message", err);
      }
    });

    socket.on("delete_message", async (data) => {
      const { messageId, chatId } = data;
      try {
        await db.update(messages).set({ isDeleted: true }).where(eq(messages.id, messageId));
        io.to(`chat_${chatId}`).emit("message_deleted", { messageId });
      } catch (err) {
        console.error("Failed to delete message", err);
      }
    });

    socket.on("react_message", async (data) => {
      const { messageId, chatId, reaction } = data;
      try {
        await db.update(messages).set({ reaction }).where(eq(messages.id, messageId));
        io.to(`chat_${chatId}`).emit("message_reaction", { messageId, reaction, chatId });
      } catch (err) {
        console.error("Failed to react to message", err);
      }
    });

    socket.on("mark_read", async ({ chatId }) => {
      try {
        await db.update(messages)
          .set({ isRead: true, isDelivered: true })
          .where(and(eq(messages.chatId, chatId), eq(messages.isRead, false)));
        io.to(`chat_${chatId}`).emit("messages_read", { chatId, userId });
      } catch(e) { console.error(e); }
    });

    socket.on("start_call", (data) => {
      // data: { receiverId, type, callId, callerId, callerName }
      io.emit("incoming_call", data);
    });

    socket.on("accept_call", (data) => {
      io.emit("call_accepted", data);
    });

    socket.on("reject_call", (data) => {
      io.emit("call_rejected", data);
    });

    socket.on("end_call", (data) => {
      io.emit("call_ended", data);
    });

    socket.on("typing", async (data) => {
      const { chatId } = data;
      await ensureRoomMembership(chatId);
      socket.to(`chat_${chatId}`).emit("typing", { chatId, userId });
    });

    socket.on("stop_typing", (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit("stop_typing", { chatId, userId });
    });

    socket.on("message_delivered", async (data) => {
      const { messageId, chatId } = data;
      try {
        await db.update(messages).set({ isDelivered: true }).where(eq(messages.id, messageId));
        io.to(`chat_${chatId}`).emit("message_delivered", { messageId, chatId });
      } catch(err) {
        console.error(err);
      }
    });

    socket.on("message_read", async (data) => {
      const { messageId, chatId } = data;
      try {
        await db.update(messages).set({ isRead: true, isDelivered: true }).where(eq(messages.id, messageId));
        io.to(`chat_${chatId}`).emit("message_read", { messageId, chatId });
      } catch(err) {
        console.error("Failed to mark message read", err);
      }
    });

    socket.on("call_offer", async (data) => {
      console.log(`[WebRTC] call_offer from ${userId} to ${data.toUserId}`);
      
      const sockets = Array.from(io.of("/").sockets.values());
      // Check if blocked
      const blocked = await db.select().from(blockedUsers)
        .where(and(eq(blockedUsers.blockerId, data.toUserId), eq(blockedUsers.blockedId, userId)))
        .limit(1);
      if (blocked.length > 0) {
        // Blocked! fake offline
        socket.emit("end_call", { reason: "offline" });
        return;
      }

      const targetSockets = sockets.filter(s => s.data.userId === data.toUserId);
      
      if (targetSockets.length === 0) {
        console.log(`[WebRTC] User ${data.toUserId} is offline`);
        socket.emit("end_call", { reason: "offline" });
        return;
      }

      // Programmatically ensure every connected socket of the target user is in their personal room
      for (const ts of targetSockets) {
        ts.join(data.toUserId);
      }

      try {
        const sender = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
        const senderName = sender?.displayName || sender?.phoneNumber || "Unknown User";
        
        io.to(data.toUserId).emit("call_offer", {
          offer: data.offer,
          fromUserId: userId,
          chatId: data.chatId,
          isVideo: data.isVideo,
          name: senderName
        });
      } catch (err) {
        console.error("Error in call_offer", err);
      }
    });

    socket.on("call_answer", (data) => {
      console.log(`[WebRTC] call_answer from ${userId} to ${data.toUserId}`);
      io.to(data.toUserId).emit("call_answer", {
        answer: data.answer,
        fromUserId: userId
      });
    });

    socket.on("ice_candidate", (data) => {
      console.log(`[WebRTC] ice_candidate from ${userId} to ${data.toUserId}`);
      io.to(data.toUserId).emit("ice_candidate", {
        candidate: data.candidate,
        fromUserId: userId
      });
    });

    socket.on("end_call", (data) => {
      io.to(data.toUserId).emit("end_call", { fromUserId: userId });
    });

    // --- WebRTC Group calls ---
    socket.on("ring_group_call", async (data) => {
      console.log(`[WebRTC] ${userId} ringing group call in chat ${data.chatId}`);
      
      try {
        const chat = await db.select().from(chats).where(eq(chats.id, data.chatId)).limit(1).then(r => r[0]);
        if (!chat || !chat.isGroup) return;

        const members = await db.select({ userId: chatMembers.userId })
          .from(chatMembers)
          .where(eq(chatMembers.chatId, data.chatId));
          
        const sender = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
        const senderName = sender?.displayName || sender?.phoneNumber || "Unknown User";

        members.forEach(m => {
          if (m.userId !== userId) {
            io.to(m.userId).emit("incoming_group_call", { 
              chatId: data.chatId,
              chatName: chat.name,
              callerName: senderName,
              isVideo: data.isVideo
            });
          }
        });
      } catch(e) {
        console.error("ring_group_call error", e);
      }
    });

    socket.on("join_group_call", (data) => {
      console.log(`[WebRTC] ${userId} joining group call in chat ${data.chatId}`);
      const room = `group_call_${data.chatId}`;
      socket.join(room);
      // Notify others in the room
      socket.to(room).emit("group_peer_joined", { userId });
    });

    socket.on("leave_group_call", (data) => {
      const room = `group_call_${data.chatId}`;
      socket.leave(room);
      socket.to(room).emit("group_peer_left", { userId });
    });

    socket.on("group_call_offer", (data) => {
      io.to(data.toUserId).emit("group_call_offer", { fromUserId: userId, offer: data.offer });
    });

    socket.on("group_call_answer", (data) => {
      io.to(data.toUserId).emit("group_call_answer", { fromUserId: userId, answer: data.answer });
    });

    socket.on("group_ice_candidate", (data) => {
      io.to(data.toUserId).emit("group_ice_candidate", { fromUserId: userId, candidate: data.candidate });
    });



    socket.on("disconnect", async () => {
      console.log("User disconnected", socket.id);
      try {
        const sockets = await io.in(`user_presence_${userId}`).fetchSockets();
        if (sockets.length === 0) {
          await db.update(users).set({ isOnline: false, lastSeen: new Date() }).where(eq(users.id, userId));
          io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() });
        }
      } catch (e) {
        console.error("Failed to set offline status", e);
      }
    });
  });

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/user", userRouter);
  app.use("/api/community", communityRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/status", statusRouter);
  app.use("/api/call", callRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/env", (req, res) => {
    const pgEnv = Object.keys(process.env).filter(k => k.startsWith('PG') || k.includes('DB') || k.includes('SQL'));
    const envObj: any = {};
    for (const key of pgEnv) {
      envObj[key] = process.env[key];
    }
    res.json(envObj);
  });

  // Global API error handler
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("Global API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  
// --- Settings API ---
app.post('/api/settings/update', authenticate, async (req: any, res) => {
  const { wallpaper, privacyLastSeen, privacyProfilePhoto, privacyStatus } = req.body;
  try {
    const userId = req.user.id;
    const updates: any = {};
    if (wallpaper !== undefined) updates.wallpaper = wallpaper;
    if (privacyLastSeen !== undefined) updates.privacyLastSeen = privacyLastSeen;
    if (privacyProfilePhoto !== undefined) updates.privacyProfilePhoto = privacyProfilePhoto;
    if (privacyStatus !== undefined) updates.privacyStatus = privacyStatus;
    
    await db.update(users).set(updates).where(eq(users.id, userId));
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Blocking API ---
app.post('/api/users/block', authenticate, async (req: any, res) => {
  const { blockedId } = req.body;
  try {
    const blockerId = req.user.id;
    const existing = await db.select().from(blockedUsers).where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId))).limit(1);
    if (existing.length === 0) {
      await db.insert(blockedUsers).values({ blockerId, blockedId });
    }
    res.json({ message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/unblock', authenticate, async (req: any, res) => {
  const { blockedId } = req.body;
  try {
    const blockerId = req.user.id;
    await db.delete(blockedUsers).where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)));
    res.json({ message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/blocked', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const blockedList = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      displayName: users.displayName,
      username: users.username,
      profilePhoto: users.profilePhoto
    })
    .from(blockedUsers)
    .innerJoin(users, eq(blockedUsers.blockedId, users.id))
    .where(eq(blockedUsers.blockerId, userId));
    res.json(blockedList);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
