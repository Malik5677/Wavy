ALTER TABLE "chat_members" ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "avatar" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "description" text;