import { db } from './backend/src/db';
import { users, chats, chatMembers, messages } from './backend/src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const allUsers = await db.select().from(users);
  const me = allUsers.find(u => u.phoneNumber === '+919306239766');
  if (!me) {
    return;
  }
  const others = allUsers.filter(u => u.id !== me.id);
  
  if (others.length < 2) return;
  
  const newChat = await db.insert(chats).values({
    isGroup: true,
    name: 'Project Team 🚀',
    description: 'General discussion for project updates',
  }).returning();
  
  const chatId = newChat[0].id;
  
  await db.insert(chatMembers).values([
    { chatId, userId: me.id, role: 'admin' },
    ...others.map(u => ({ chatId, userId: u.id, role: 'member' }))
  ]);
  
  await db.insert(messages).values({
    chatId,
    senderId: others[0].id,
    content: `Welcome everyone to the new group!`,
    type: 'text'
  });
  
  console.log("seeded group");
}
main();
