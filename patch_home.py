with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Add isBlockedByMe before return (
content = content.replace(
    '  return (\n    <div className="flex h-screen w-full bg-[#0B141A] font-sans text-[#e9edef] overflow-hidden">',
    '  const isBlockedByMe = activeChat && !activeChat.isGroup && activeChat.otherUser && blockedUsers.some(u => u.id === activeChat.otherUser.id);\n\n  return (\n    <div className="flex h-screen w-full bg-[#0B141A] font-sans text-[#e9edef] overflow-hidden">'
)

# Update the call buttons to only show if not blocked
call_buttons_old = """                <button onClick={() => {
                  if (activeChat?.isGroup) {
                    setIsGroupCalling({ isVideo: true, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                    socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: true });
                  } else if (activeChat?.otherUser) {
                    setIsCalling({ isVideo: true, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                  } else {
                    toast.error("Can only call direct contacts");
                  }
                }} className="hover:text-[#00A884] transition-colors"><Video size={20} /></button>
                <button onClick={() => {
                  if (activeChat?.isGroup) {
                    setIsGroupCalling({ isVideo: false, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                    socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: false });
                  } else if (activeChat?.otherUser) {
                    setIsCalling({ isVideo: false, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                  } else {
                    toast.error("Can only call direct contacts");
                  }
                }} className="hover:text-[#00A884] transition-colors"><Phone size={20} /></button>"""

call_buttons_new = """                {!isBlockedByMe && (
                  <>
                    <button onClick={() => {
                      if (activeChat?.isGroup) {
                        setIsGroupCalling({ isVideo: true, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                        socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: true });
                      } else if (activeChat?.otherUser) {
                        setIsCalling({ isVideo: true, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                      } else {
                        toast.error("Can only call direct contacts");
                      }
                    }} className="hover:text-[#00A884] transition-colors"><Video size={20} /></button>
                    <button onClick={() => {
                      if (activeChat?.isGroup) {
                        setIsGroupCalling({ isVideo: false, chatName: activeChat.name || 'Group Call', chatId: activeChat.chatId });
                        socket?.emit('ring_group_call', { chatId: activeChat.chatId, isVideo: false });
                      } else if (activeChat?.otherUser) {
                        setIsCalling({ isVideo: false, name: activeChat.name || 'Unknown', targetUserId: activeChat.otherUser.id, chatId: activeChat.chatId });
                      } else {
                        toast.error("Can only call direct contacts");
                      }
                    }} className="hover:text-[#00A884] transition-colors"><Phone size={20} /></button>
                  </>
                )}"""

content = content.replace(call_buttons_old, call_buttons_new)

# Also update the inner footer content block to use the top-level isBlockedByMe instead of redefining
footer_old = """              {(() => {
                const isBlockedByMe = activeChat && !activeChat.isGroup && activeChat.otherUser && blockedUsers.some(u => u.id === activeChat.otherUser.id);
                if (isBlockedByMe) {"""

footer_new = """              {(() => {
                if (isBlockedByMe) {"""

content = content.replace(footer_old, footer_new)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched Home.tsx")
