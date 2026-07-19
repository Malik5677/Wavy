import { Router } from 'express';
import { db } from '../db';
import { users, otpCodes } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'wavechat-super-secret-key';

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ================= SEND OTP =================
authRouter.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpCodes).values({
      phoneNumber,
      code,
      expiresAt,
    });

    console.log(`[MOCK OTP] Sent code ${code} to ${phoneNumber}`);

    res.json({
      success: true,
      mockCode: code,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);

    res.status(500).json({
      error: "Failed to send OTP",
    });
  }
});

// ================= VERIFY OTP =================
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: 'Phone number and OTP are required',
      });
    }

    const result = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.phoneNumber, phoneNumber))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    const otp = result[0];

    if (!otp) {
      return res.status(400).json({
        error: 'OTP not found',
      });
    }

    if (otp.code !== code) {
      return res.status(400).json({
        error: 'Invalid OTP',
      });
    }

    if (new Date() > otp.expiresAt) {
      return res.status(400).json({
        error: 'OTP expired',
      });
    }

    // Find existing user
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    let user = existingUser[0];

   if (!user) {
  console.log("🟡 User not found. Creating new user...");

  const insertResult = await db
    .insert(users)
    .values({
      phoneNumber,
      isOnline: true,
    })
    .returning();

  console.log("✅ User inserted:", insertResult);

  user = insertResult[0];
} else {
  console.log("🟢 Existing user:", user);

  await db
    .update(users)
    .set({
      isOnline: true,
      lastSeen: new Date(),
    })
    .where(eq(users.id, user.id));


      console.log("✅ EXISTING USER LOGIN");
      console.log(user);
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    await db
      .delete(otpCodes)
      .where(eq(otpCodes.phoneNumber, phoneNumber));

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR");
    console.error(err);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});