import { Router } from 'express';
import { db } from '../db';
import { users, otpCodes } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware';
import nodemailer from 'nodemailer';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'wavechat-super-secret-key';

const normalizePhoneNumber = (input: string) => {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const isValidPhoneNumber = (input: string) => {
  const digits = normalizePhoneNumber(input);
  return /^[6789][0-9]{9}$/.test(digits);
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const createEmailTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS must be configured for email delivery');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmailOtp = async (email: string, code: string) => {
  const transporter = createEmailTransporter();
  const message = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'WaveChat OTP Verification',
    text: `Your WaveChat OTP is ${code}. It expires in 10 minutes.`,
    html: `<p>Your WaveChat OTP is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  };
  return transporter.sendMail(message);
};

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ================= SEND OTP =================
authRouter.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber, email } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits and start with 6, 7, 8, or 9' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(otpCodes).where(and(eq(otpCodes.phoneNumber, normalizedPhone), eq(otpCodes.email, email)));
    await db.insert(otpCodes).values({
      phoneNumber: normalizedPhone,
      email,
      code,
      expiresAt,
    });

    try {
      await sendEmailOtp(email, code);
    } catch (emailError) {
      console.error('Email OTP failed:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    console.log(`[OTP] Sent code ${code} to ${email} for user ${normalizedPhone}`);

    res.json({
      success: true,
      message: 'OTP sent to email',
    });
  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ================= VERIFY OTP =================
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, email, code, displayName } = req.body;

    if (!phoneNumber || !email || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Phone number, email, and OTP are required' });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits and start with 6, 7, 8, or 9' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const result = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phoneNumber, normalizedPhone), eq(otpCodes.email, email)))
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
      .where(eq(users.phoneNumber, normalizedPhone))
      .limit(1);

    let user = existingUser[0];

    if (!user) {
      const existingByEmail = await db
        .select()
        .from(users)
        .where(eq(users.username, email))
        .limit(1);

      if (existingByEmail.length > 0) {
        return res.status(400).json({ error: 'Email is already in use with a different phone number' });
      }

      const insertResult = await db
        .insert(users)
        .values({
          phoneNumber: normalizedPhone,
          username: email,
          displayName: displayName || email,
          isOnline: true,
        })
        .returning();

      user = insertResult[0];
    } else {
      if (user.username && user.username !== email) {
        return res.status(400).json({ error: 'This phone number is already registered with a different email' });
      }

      await db.update(users).set({
        username: email,
        displayName: displayName || user.displayName || email,
        isOnline: true,
        lastSeen: new Date(),
      }).where(eq(users.id, user.id));

      const updatedUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      user = updatedUser[0];
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
      .where(and(eq(otpCodes.phoneNumber, normalizedPhone), eq(otpCodes.email, email)));

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