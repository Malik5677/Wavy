import { pgTable, text, timestamp, uuid, boolean, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  profilePhoto: text('profile_photo'),
  isOnline: boolean('is_online').default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  wallpaper: text('wallpaper').default('default'),
  privacyLastSeen: varchar('privacy_last_seen', { length: 20 }).default('everyone'),
  privacyProfilePhoto: varchar('privacy_profile_photo', { length: 20 }).default('everyone'),
  privacyStatus: varchar('privacy_status', { length: 20 }).default('everyone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const failedLoginAttempts = pgTable('failed_login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  lastAttempt: timestamp('last_attempt').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  deviceInfo: varchar('device_info', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false).notNull(),
});

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityMembers = pgTable('community_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').references(() => communities.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(), // admin, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  isGroup: boolean('is_group').default(false).notNull(),
  name: varchar('name', { length: 100 }), // for groups
  avatar: text('avatar'), // for group image
  description: text('description'), // for group description
  communityId: uuid('community_id').references(() => communities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMembers = pgTable('chat_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(), // admin, member
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content'),
  type: varchar('type', { length: 20 }).default('text').notNull(), // text, image, etc.
  replyToId: uuid('reply_to_id'), // Self reference for replies
  reaction: varchar('reaction', { length: 50 }),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  isDelivered: boolean('is_delivered').default(false).notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const statuses = pgTable('statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).default('text').notNull(), // text, image
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  callerId: uuid('caller_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).default('audio').notNull(), // audio, video
  status: varchar('status', { length: 20 }).default('missed').notNull(), // missed, completed, rejected
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockerId: uuid('blocker_id').references(() => users.id).notNull(),
  blockedId: uuid('blocked_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  contactId: uuid('contact_id').references(() => users.id).notNull(),
  customName: varchar('custom_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
