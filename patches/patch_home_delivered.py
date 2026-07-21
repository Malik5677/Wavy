with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

messages_delivered = """
      newSocket.on("messages_delivered", ({ chatId }) => {
        if (activeChatRef.current?.chatId === chatId) {
          setMessages(prev => prev.map(m => ({ ...m, isDelivered: true })));
        }
      });
"""
content = content.replace('newSocket.on("message_read", ({ messageId, chatId }) => {', messages_delivered + '\n      newSocket.on("message_read", ({ messageId, chatId }) => {')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched Home.tsx messages_delivered")
