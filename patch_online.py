with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# 1. Update online indicator in chat list (first occurrence)
content = content.replace(
    '{chat.otherUser && chat.otherUser.isOnline && (',
    '{chat.otherUser && chat.otherUser.isOnline && !blockedUsers.some(u => u.id === chat.otherUser?.id) && ('
)

# 2. Update typing indicator in active chat header
typing_header_old = """                  {activeChat.otherUser && typingUsers[activeChat.otherUser.id] ? (
                    <span className="text-[11px] text-[#00A884] font-medium">typing...</span>
                  ) : (
                    <span className={`text-[11px] font-medium ${activeChat.isGroup || activeChat.otherUser?.isOnline ? 'text-[#00A884]' : 'text-[#8696a0]'}`}>
                      {activeChat.isGroup ? `${activeChat.description || 'Group'}` : (!activeChat.otherUser ? 'Message yourself' : (activeChat.otherUser.isOnline ? 'Online' : 'Offline'))}
                    </span>
                  )}"""

typing_header_new = """                  {activeChat.otherUser && typingUsers[activeChat.otherUser.id] && !isBlockedByMe ? (
                    <span className="text-[11px] text-[#00A884] font-medium">typing...</span>
                  ) : (
                    <span className={`text-[11px] font-medium ${activeChat.isGroup || (activeChat.otherUser?.isOnline && !isBlockedByMe) ? 'text-[#00A884]' : 'text-[#8696a0]'}`}>
                      {activeChat.isGroup ? `${activeChat.description || 'Group'}` : (!activeChat.otherUser ? 'Message yourself' : (isBlockedByMe ? '' : (activeChat.otherUser.isOnline ? 'Online' : 'Offline')))}
                    </span>
                  )}"""
content = content.replace(typing_header_old, typing_header_new)

# 3. Update typing indicator in chat list
typing_list_old = """                        {chat.otherUser && typingUsers[chat.otherUser.id] ? (
                          <p className="text-sm truncate text-[#00A884] font-medium">typing...</p>
                        ) : ("""

typing_list_new = """                        {chat.otherUser && typingUsers[chat.otherUser.id] && !blockedUsers.some(u => u.id === chat.otherUser?.id) ? (
                          <p className="text-sm truncate text-[#00A884] font-medium">typing...</p>
                        ) : ("""
content = content.replace(typing_list_old, typing_list_new)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched online status")
