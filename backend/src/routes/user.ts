import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, contacts, chatMembers, chats, messages, statuses, blockedUsers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware';
import { applyPrivacyFilters } from '../utils/privacy';

const JWT_SECRET = process.env.JWT_SECRET || 'wavechat-super-secret-key';

export const userRouter = Router();

const avatarUploadPath = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarUploadPath)) {
  fs.mkdirSync(avatarUploadPath, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarUploadPath),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, safeName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Avatar must be an image file'));
    }
    cb(null, true);
  }
});

userRouter.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

userRouter.get('/share/:id', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    let viewerId = '';

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const viewer = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1).then(r => r[0]);
        if (viewer) viewerId = viewer.id;
      } catch (err) {
        // ignore invalid token for public profile viewing
      }
    }

    const userProfile = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1).then(r => r[0]);
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }
    const filteredProfile = await applyPrivacyFilters(userProfile, viewerId);
    res.json(filteredProfile);
  } catch (error) {
    console.error('Error fetching shared profile', error);
    res.status(500).json({ error: 'Failed to fetch shared profile' });
  }
});

userRouter.put('/profile', authenticate, async (req, res) => {
  try {
    const { displayName, bio, username, profilePhoto } = req.body;
    const userId = req.user.id;

    if (username) {
      // Check if username is taken by another user
      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1).then(r => r[0]);
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (username !== undefined) updateData.username = username;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating profile', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

userRouter.post('/avatar', authenticate, upload.single('avatar'), async (req: any, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: 'Avatar image is required' });
    }

    const profilePhotoUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    const updatedUser = await db.update(users)
      .set({ profilePhoto: profilePhotoUrl })
      .where(eq(users.id, userId))
      .returning();

    res.json({ profilePhoto: profilePhotoUrl, user: updatedUser[0] });
  } catch (error: any) {
    console.error('Error uploading avatar', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

userRouter.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
    const contactList = await db.select().from(contacts).where(eq(contacts.userId, userId));
    const chatList = await db.select({ chatId: chats.id, isGroup: chats.isGroup, name: chats.name, description: chats.description, createdAt: chats.createdAt, updatedAt: chats.updatedAt })
      .from(chats)
      .innerJoin(chatMembers, eq(chats.id, chatMembers.chatId))
      .where(eq(chatMembers.userId, userId));
    const messagesList = await db.select().from(messages).where(eq(messages.senderId, userId));
    const statusesList = await db.select().from(statuses).where(eq(statuses.userId, userId));
    const blockedList = await db.select().from(blockedUsers).where(eq(blockedUsers.blockerId, userId));

    const payload = {
      profile: userProfile,
      contacts: contactList,
      chats: chatList,
      messages: messagesList,
      statuses: statusesList,
      blockedUsers: blockedList,
      summary: {
        contacts: contactList.length,
        chats: chatList.length,
        messages: messagesList.length,
        statuses: statusesList.length,
        blockedUsers: blockedList.length,
        exportedAt: new Date().toISOString(),
      }
    };

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="wavy-export-${userId}.json"`);
    }

    res.json(payload);
  } catch (error) {
    console.error('Error exporting user data', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

userRouter.post('/backup', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
    const contactList = await db.select().from(contacts).where(eq(contacts.userId, userId));
    const chatList = await db.select({ chatId: chats.id, isGroup: chats.isGroup, name: chats.name, description: chats.description, createdAt: chats.createdAt, updatedAt: chats.updatedAt })
      .from(chats)
      .innerJoin(chatMembers, eq(chats.id, chatMembers.chatId))
      .where(eq(chatMembers.userId, userId));
    const messagesList = await db.select().from(messages).where(eq(messages.senderId, userId));
    const statusesList = await db.select().from(statuses).where(eq(statuses.userId, userId));

    const payload = {
      profile: userProfile,
      contacts: contactList,
      chats: chatList,
      messages: messagesList,
      statuses: statusesList,
      backedUpAt: new Date().toISOString(),
    };

    const backupDirectory = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDirectory)) fs.mkdirSync(backupDirectory, { recursive: true });
    const fileName = `backup-${userId}-${Date.now()}.json`;
    const filePath = path.join(backupDirectory, fileName);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    res.json({ fileName });
  } catch (error) {
    console.error('Error creating backup', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

userRouter.get('/backup/:fileName', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const fileName = path.basename(req.params.fileName);
    if (!fileName.startsWith(`backup-${userId}-`) || !fileName.endsWith('.json')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const filePath = path.join(process.cwd(), 'backups', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading backup file', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

userRouter.get('/contacts', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userContacts = await db.select().from(contacts).where(eq(contacts.userId, userId));
    res.json(userContacts);
  } catch (error) {
    console.error('Error fetching contacts', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

userRouter.post('/contacts', authenticate, async (req, res) => {
  try {
    const { contactId, customName } = req.body;
    const userId = req.user.id;
    
    const existing = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))).limit(1).then(r => r[0]);
    
    if (existing) {
      await db.update(contacts).set({ customName }).where(eq(contacts.id, existing.id));
    } else {
      await db.insert(contacts).values({ userId, contactId, customName });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving contact', error);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});
