ALTER TABLE "chat_members" ADD COLUMN "role" varchar(20) DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "description" text;