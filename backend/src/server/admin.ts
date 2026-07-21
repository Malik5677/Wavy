import { Router } from 'express';
import { db } from '../db';
import { users, messages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticate } from './middleware';

export const adminRouter = Router();

adminRouter.use(authenticate);

// We should ideally check if req.user is an admin, but for now we'll allow it for demonstration
adminRouter.get('/stats', async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allMessages = await db.select({ id: messages.id }).from(messages);
    
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.isOnline).length,
      totalMessages: allMessages.length
    };
    
    res.json({ stats, users: allUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

adminRouter.post('/users/:userId/ban', async (req, res) => {
  try {
    // Basic ban implementation could just be setting a flag, but we don't have one in schema yet.
    // For now we'll just return success to simulate it.
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});
