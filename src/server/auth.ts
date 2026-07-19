import { Router } from 'express';
import { db } from '../db';
import { users, otpCodes } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

import { authenticate } from './middleware';

export const authRouter = Router();

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

const JWT_SECRET = process.env.JWT_SECRET || 'wavechat-super-secret-key';

// Mock sending OTP
authRouter.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpCodes).values({
    phoneNumber,
    code,
    expiresAt,
  });

  console.log(`[MOCK OTP] Sent code ${code} to ${phoneNumber}`);
  // In a real app, send via SMS API
  
  res.json({ message: 'OTP sent successfully', mockCode: code });
});

authRouter.post('/verify-otp', async (req, res) => {
  const { phoneNumber, code } = req.body;
  
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'Phone number and code required' });
  }

  const result = await db.select().from(otpCodes)
    .where(eq(otpCodes.phoneNumber, phoneNumber))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  const otpRecord = result[0]; // get latest

  if (!otpRecord || otpRecord.code !== code || new Date() > otpRecord.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Find or create user
  let user = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1).then(r => r[0]);
  
  if (!user) {
    const insertResult = await db.insert(users).values({
      phoneNumber,
      isOnline: true,
    }).returning();
    user = insertResult[0];
  } else {
    await db.update(users).set({ isOnline: true }).where(eq(users.id, user.id));
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  // Clear OTPs for this number
  await db.delete(otpCodes).where(eq(otpCodes.phoneNumber, phoneNumber));

  res.json({
    token,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      username: user.username,
      displayName: user.displayName,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
    }
  });
});
