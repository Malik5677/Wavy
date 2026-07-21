-- Create extensions and auth tables needed for refresh token/session support.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL,
  email varchar(255) NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp,
  last_attempt timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  device_info varchar(255),
  ip_address varchar(100),
  user_agent text,
  created_at timestamp NOT NULL DEFAULT now(),
  last_used timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);

-- Clear existing users and all related data so the next run starts clean.
TRUNCATE TABLE
  sessions,
  failed_login_attempts,
  otp_codes,
  messages,
  chat_members,
  chats,
  statuses,
  calls,
  community_members,
  communities,
  contacts,
  blocked_users,
  users
CASCADE;
