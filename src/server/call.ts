import { Router } from 'express';
import { db } from '../db';
import { calls, users } from '../db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { authenticate } from './middleware';

export const callRouter = Router();
callRouter.use(authenticate);

// Get call history
callRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const userCalls = await db.select({
      id: calls.id,
      callerId: calls.callerId,
      receiverId: calls.receiverId,
      type: calls.type,
      status: calls.status,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      callerName: users.displayName,
      callerPhone: users.phoneNumber,
    })
    .from(calls)
    .innerJoin(users, eq(calls.callerId, users.id))
    .where(or(eq(calls.callerId, userId), eq(calls.receiverId, userId)))
    .orderBy(desc(calls.startedAt))
    .limit(50);

    // We need receiver info too
    const formattedCalls = await Promise.all(userCalls.map(async (c) => {
      if (c.callerId === userId) {
        // I am the caller, need receiver details
        const receiver = await db.select().from(users).where(eq(users.id, c.receiverId)).limit(1).then(r => r[0]);
        return {
          ...c,
          isIncoming: false,
          otherUser: receiver
        };
      } else {
        // I am the receiver, caller info is already joined
        return {
          ...c,
          isIncoming: true,
          otherUser: {
            id: c.callerId,
            displayName: c.callerName,
            phoneNumber: c.callerPhone
          }
        };
      }
    }));

    res.json(formattedCalls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Start call (record it)
callRouter.post('/', async (req, res) => {
  const { receiverId, type } = req.body;
  const callerId = req.user.id;
  try {
    const newCall = await db.insert(calls).values({
      callerId,
      receiverId,
      type: type || 'audio',
      status: 'missed' // default, will be updated to completed if accepted
    }).returning();
    res.json(newCall[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start call' });
  }
});

// Update call status
callRouter.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateData: any = { status };
    if (status === 'completed' || status === 'rejected') {
      updateData.endedAt = new Date();
    }
    await db.update(calls).set(updateData).where(eq(calls.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update call' });
  }
});
