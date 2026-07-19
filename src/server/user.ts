import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { contacts } from '../db/schema';
import { authenticate } from './middleware';

export const userRouter = Router();

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
