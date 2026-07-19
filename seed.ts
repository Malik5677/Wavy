import { db } from './src/db';
import { users, chats, chatMembers, messages } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const allUsers = await db.select().from(users);
  const me = allUsers.find(u => u.phoneNumber === '+919306239766');
  if (!me) {
    console.log("me not found");
    return;
  }
  
  const others = allUsers.filter(u => u.id !== me.id);
  
  for (const other of others) {
    // Check if chat exists
    const myChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, me.id));
    const otherChats = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, other.id));
    
    const myChatIds = myChats.map(c => c.chatId);
    const otherChatIds = otherChats.map(c => c.chatId);
    const commonChatId = myChatIds.find(id => otherChatIds.includes(id));
    
    let chatId = commonChatId;
    if (!chatId) {
      const newChat = await db.insert(chats).values({
        isGroup: false,
      }).returning();
      
      chatId = newChat[0].id;
      
      await db.insert(chatMembers).values([
        { chatId, userId: me.id },
        { chatId, userId: other.id }
      ]);
    }
    
    // add a message
    await db.insert(messages).values({
      chatId,
      senderId: other.id,
      content: `Hey! This is ${other.displayName}. I'm doing well!`,
      type: 'text'
    });
  }
  console.log("seeded");
}
main();
