import { Router } from 'express';
import { db } from '../db';
import { failedLoginAttempts, sessions, users, otpCodes } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware';
import { google } from 'googleapis';
import crypto from 'crypto';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'wavechat-super-secret-key';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const OTP_LOCK_THRESHOLD = 5;
const OTP_LOCK_DURATION_MINUTES = 15;

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

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const getDeviceInfo = (req: any) => {
  const userAgent = req.headers['user-agent']?.toString() || '';
  const ipAddress = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket.remoteAddress || '';
  return {
    userAgent,
    ipAddress,
    deviceInfo: userAgent.slice(0, 255),
  };
};

const setRefreshTokenCookie = (res: any, token: string) => {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res: any) => {
  res.clearCookie('refreshToken', { path: '/' });
};

const createSessionRecord = async (userId: string, req: any) => {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const { userAgent, ipAddress, deviceInfo } = getDeviceInfo(req);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    refreshTokenHash,
    userAgent,
    ipAddress,
    deviceInfo,
    expiresAt,
  });

  return refreshToken;
};

const rotateSessionToken = async (sessionId: string, req: any) => {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await db.update(sessions).set({
    refreshTokenHash,
    lastUsed: new Date(),
    expiresAt,
  }).where(eq(sessions.id, sessionId));

  return refreshToken;
};

const findSessionByToken = async (token: string) => {
  const refreshTokenHash = hashToken(token);
  const records = await db.select().from(sessions)
    .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), eq(sessions.revoked, false)))
    .limit(1);
  return records[0];
};

const revokeSession = async (sessionId: string) => {
  await db.update(sessions).set({ revoked: true }).where(eq(sessions.id, sessionId));
};

const revokeAllSessions = async (userId: string) => {
  await db.update(sessions).set({ revoked: true }).where(eq(sessions.userId, userId));
};

const getAuthAttemptRecord = async (phoneNumber: string, email: string) => {
  const records = await db.select().from(failedLoginAttempts)
    .where(and(eq(failedLoginAttempts.phoneNumber, phoneNumber), eq(failedLoginAttempts.email, email)))
    .limit(1);
  return records[0];
};

const incrementFailedAttempt = async (phoneNumber: string, email: string) => {
  const record = await getAuthAttemptRecord(phoneNumber, email);
  if (!record) {
    await db.insert(failedLoginAttempts).values({
      phoneNumber,
      email,
      attempts: 1,
      lockedUntil: null,
    });
    return;
  }

  const attempts = Number(record.attempts) + 1;
  const lockedUntil = attempts >= OTP_LOCK_THRESHOLD ? new Date(Date.now() + OTP_LOCK_DURATION_MINUTES * 60 * 1000) : record.lockedUntil;

  await db.update(failedLoginAttempts)
    .set({
      attempts,
      lockedUntil,
      lastAttempt: new Date(),
    })
    .where(eq(failedLoginAttempts.id, record.id));
};

const resetFailedAttempts = async (phoneNumber: string, email: string) => {
  await db.delete(failedLoginAttempts)
    .where(and(eq(failedLoginAttempts.phoneNumber, phoneNumber), eq(failedLoginAttempts.email, email)));
};

const verifyLockState = (record: any) => {
  if (!record?.lockedUntil) return false;
  return new Date() < new Date(record.lockedUntil);
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const buildRawEmail = (to: string, from: string, subject: string, htmlBody: string) => {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendEmailOtp = async (email: string, code: string) => {
  const fromAddress = process.env.GMAIL_USER_EMAIL || process.env.GMAIL_USER;
  if (!fromAddress || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error('Gmail API credentials are not fully configured');
  }

  const htmlContent = `<p>Your WaveChat OTP is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`;
  const raw = buildRawEmail(email, fromAddress, 'WaveChat OTP Verification', htmlContent);

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
    },
  });
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

// ================= EMAIL DEBUG =================
authRouter.get('/debug-email', async (_req, res) => {
  try {
    const fromEmail = process.env.GMAIL_USER_EMAIL || process.env.GMAIL_USER;
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN || !fromEmail) {
      return res.status(500).json({ success: false, error: 'Gmail API environment variables are not configured' });
    }

    const accessToken = await oauth2Client.getAccessToken();
    res.json({
      success: true,
      provider: 'gmail-api',
      email: fromEmail,
      accessTokenAvailable: !!accessToken?.token,
      accessTokenExpiry: accessToken?.res?.data?.expires_in || null,
    });
  } catch (err: any) {
    console.error('EMAIL DEBUG ERROR:', err);
    res.status(500).json({ error: err.message || 'Email debug failed' });
  }
});

// ================= REFRESH TOKEN =================
authRouter.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }

    const session = await findSessionByToken(refreshToken);
    if (!session || new Date(session.expiresAt) < new Date()) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId)).limit(1).then(r => r[0]);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Invalid session' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = await rotateSessionToken(session.id, req);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('REFRESH TOKEN ERROR', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ================= LOGOUT =================
authRouter.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const session = await findSessionByToken(refreshToken);
      if (session) {
        await revokeSession(session.id);
      }
    }
    clearRefreshTokenCookie(res);
    res.json({ success: true });
  } catch (err) {
    console.error('LOGOUT ERROR', err);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

// ================= SESSION HISTORY =================
authRouter.get('/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionList = await db.select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      deviceInfo: sessions.deviceInfo,
      createdAt: sessions.createdAt,
      lastUsed: sessions.lastUsed,
      expiresAt: sessions.expiresAt,
      revoked: sessions.revoked,
    }).from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt));

    res.json(sessionList);
  } catch (err) {
    console.error('SESSION HISTORY ERROR', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ================= REVOKE SESSION =================
authRouter.post('/sessions/revoke', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1).then(r => r[0]);
    if (!session || session.userId !== userId) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    await revokeSession(sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error('REVOKE SESSION ERROR', err);
    res.status(500).json({ error: 'Failed to revoke session' });
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

    const authRecord = await getAuthAttemptRecord(normalizedPhone, email);
    if (verifyLockState(authRecord)) {
      return res.status(429).json({
        error: 'Too many failed OTP attempts. Please try again later.',
      });
    }

    if (!otp) {
      await incrementFailedAttempt(normalizedPhone, email);
      return res.status(400).json({
        error: 'OTP not found',
      });
    }

    if (otp.code !== code) {
      await incrementFailedAttempt(normalizedPhone, email);
      return res.status(400).json({
        error: 'Invalid OTP',
      });
    }

    if (new Date() > otp.expiresAt) {
      await incrementFailedAttempt(normalizedPhone, email);
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

    const refreshToken = await createSessionRecord(user.id, req);
    setRefreshTokenCookie(res, refreshToken);
    await resetFailedAttempts(normalizedPhone, email);

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