import { Router } from 'express';
import { db } from '../db';
import { users, statuses } from '../db/schema';
import { eq, gt, desc } from 'drizzle-orm';
import { authenticate } from '../middleware';
import { applyPrivacyFilters, canViewStatuses } from '../utils/privacy';

export const statusRouter = Router();
statusRouter.use(authenticate);

// Get active statuses
statusRouter.get('/', async (req, res) => {
  try {
    const allStatuses = await db.select({
      id: statuses.id,
      userId: statuses.userId,
      content: statuses.content,
      type: statuses.type,
      createdAt: statuses.createdAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        profilePhoto: users.profilePhoto
      }
    })
    .from(statuses)
    .innerJoin(users, eq(statuses.userId, users.id))
    .where(gt(statuses.expiresAt, new Date()))
    .orderBy(desc(statuses.createdAt));

    // Group by user and apply privacy filters
    const userMap = new Map();
    for (const st of allStatuses) {
      const canView = await canViewStatuses(st.user, req.user.id);
      if (!canView) continue;

      const filteredUser = await applyPrivacyFilters(st.user, req.user.id);
      if (!userMap.has(st.userId)) {
        userMap.set(st.userId, {
          user: filteredUser,
          statuses: []
        });
      }
      // Push at end so oldest is first? We fetched desc, so we want to reverse it per user or keep it asc?
      // Usually you view statuses oldest to newest. So unshift.
      userMap.get(st.userId).statuses.unshift({
        id: st.id,
        content: st.content,
        type: st.type,
        createdAt: st.createdAt
      });
    }

    res.json(Array.from(userMap.values()));
  } catch (err) {
    console.error('Fetch statuses error:', err);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// Create a status
statusRouter.post('/', async (req, res) => {
  try {
    const { content, type, durationHours = 24 } = req.body;
    const userId = req.user.id;

    if (!content) return res.status(400).json({ error: 'Content required' });
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const newStatus = await db.insert(statuses).values({
      userId,
      content,
      type: type || 'text',
      expiresAt
    }).returning();

    res.json(newStatus[0]);
  } catch (err) {
    console.error('Create status error:', err);
    res.status(500).json({ error: 'Failed to create status' });
  }
});
