import { Router } from 'express';
import { db } from '../db';
import { users, communities, communityMembers, chats, chatMembers, messages } from '../db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { authenticate } from '../middleware';

export const communityRouter = Router();
communityRouter.use(authenticate);

// Get all communities for the user
communityRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  
  try {
    const userCommunities = await db.select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      avatar: communities.avatar,
      createdAt: communities.createdAt,
    })
    .from(communityMembers)
    .innerJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(eq(communityMembers.userId, userId))
    .orderBy(desc(communities.createdAt));

    // For each community, fetch its groups and members count
    const formattedCommunities = await Promise.all(userCommunities.map(async (comm) => {
      const groups = await db.select({
        id: chats.id,
        name: chats.name
      }).from(chats).where(eq(chats.communityId, comm.id));

      const membersRaw = await db.select({ id: communityMembers.id }).from(communityMembers).where(eq(communityMembers.communityId, comm.id));

      return {
        ...comm,
        groups: groups,
        membersCount: membersRaw.length
      };
    }));

    res.json(formattedCommunities);
  } catch (err) {
    console.error('Fetch communities error:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Create a community
communityRouter.post('/', async (req, res) => {
  const { name, description, avatar, groupNames } = req.body;
  const userId = req.user.id;
  
  if (!name) {
    return res.status(400).json({ error: 'Community name is required' });
  }

  try {
    // 1. Create Community
    const newComm = await db.insert(communities).values({
      name,
      description,
      avatar,
    }).returning();

    const communityId = newComm[0].id;

    // 2. Add creator as admin
    await db.insert(communityMembers).values({
      communityId,
      userId,
      role: 'admin'
    });

    // 3. Create default 'Announcements' group
    const announcementsGroup = await db.insert(chats).values({
      isGroup: true,
      name: 'Announcements',
      communityId
    }).returning();

    await db.insert(chatMembers).values({
      chatId: announcementsGroup[0].id,
      userId,
      role: 'admin'
    });

    // 4. Create other groups if provided
    if (groupNames && Array.isArray(groupNames)) {
      for (const gName of groupNames) {
        if (gName !== 'Announcements') {
          const group = await db.insert(chats).values({
            isGroup: true,
            name: gName,
            communityId
          }).returning();

          await db.insert(chatMembers).values({
            chatId: group[0].id,
            userId,
            role: 'admin'
          });
        }
      }
    }

    res.json({ id: communityId, ...newComm[0] });
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
});
