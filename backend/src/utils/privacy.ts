import { db } from '../db';
import { contacts } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const isContactForUser = async (ownerId: string, viewerId: string) => {
  if (!ownerId || !viewerId) return false;
  if (ownerId === viewerId) return true;

  const record = await db.select()
    .from(contacts)
    .where(and(eq(contacts.userId, ownerId), eq(contacts.contactId, viewerId)))
    .limit(1)
    .then((rows) => rows[0]);

  return Boolean(record);
};

export const applyPrivacyFilters = async (targetUser: any, viewerId: string) => {
  if (!targetUser) return null;

  const isOwner = targetUser.id === viewerId;
  const isContact = await isContactForUser(targetUser.id, viewerId);
  const filtered = { ...targetUser };

  if (!isOwner) {
    if (targetUser.privacyProfilePhoto === 'nobody' || (targetUser.privacyProfilePhoto === 'contacts' && !isContact)) {
      filtered.profilePhoto = null;
    }
    if (targetUser.privacyLastSeen === 'nobody' || (targetUser.privacyLastSeen === 'contacts' && !isContact)) {
      filtered.isOnline = false;
      filtered.lastSeen = null;
    }
    if (targetUser.privacyStatus === 'nobody' || (targetUser.privacyStatus === 'contacts' && !isContact)) {
      filtered.bio = null;
    }
  }

  return filtered;
};

export const canViewStatuses = async (targetUser: any, viewerId: string) => {
  if (!targetUser) return false;
  if (targetUser.id === viewerId) return true;

  if (targetUser.privacyStatus === 'everyone') {
    return true;
  }

  if (targetUser.privacyStatus === 'contacts') {
    return await isContactForUser(targetUser.id, viewerId);
  }

  return false;
};
