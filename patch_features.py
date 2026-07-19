import re

with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

state_additions = """
  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [favouriteChats, setFavouriteChats] = useState<string[]>([]);
  const [disappearingChats, setDisappearingChats] = useState<string[]>([]);
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
"""

# Insert state
for i, line in enumerate(lines):
    if "const [showChatMenu, setShowChatMenu] = useState(false);" in line:
        lines.insert(i + 1, state_additions)
        break

# Update the 3-dots menu
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "                  <div className=\"absolute right-6 top-16 w-[220px] bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm flex flex-col\">" in line:
        start_idx = i
    if start_idx != -1 and "                  </div>" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_menu = """                  <div className="absolute right-6 top-16 w-[220px] bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm flex flex-col">
                    <button onClick={() => { setShowContactInfo(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Contact info</button>
                    <button onClick={() => { setIsChatSearchOpen(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Search</button>
                    <button onClick={() => { setIsSelectingMessages(!isSelectingMessages); setSelectedMessages([]); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{isSelectingMessages ? 'Cancel selection' : 'Select messages'}</button>
                    <button onClick={() => { 
                      setMutedChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]); 
                      toast.success(mutedChats.includes(activeChat?.chatId) ? 'Chat unmuted' : 'Chat muted');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition flex justify-between items-center">{mutedChats.includes(activeChat?.chatId) ? 'Unmute notifications' : 'Mute notifications'}</button>
                    <button onClick={() => { 
                      setDisappearingChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]);
                      toast.success(disappearingChats.includes(activeChat?.chatId) ? 'Disappearing messages off' : 'Disappearing messages on (24 hours)');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{disappearingChats.includes(activeChat?.chatId) ? 'Turn off disappearing messages' : 'Disappearing messages'}</button>
                    <button onClick={() => { 
                      setFavouriteChats(prev => prev.includes(activeChat?.chatId) ? prev.filter(id => id !== activeChat?.chatId) : [...prev, activeChat?.chatId]);
                      toast.success(favouriteChats.includes(activeChat?.chatId) ? 'Removed from favourites' : 'Added to favourites');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">{favouriteChats.includes(activeChat?.chatId) ? 'Remove from favourites' : 'Add to favourites'}</button>
                    <button onClick={() => { setActiveChat(null); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Close chat</button>
                    <button onClick={() => { navigator.clipboard.writeText(`https://wavechat.com/call/${activeChat?.chatId}`); toast.success('Call link copied'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Send call link</button>
                    <button onClick={() => { 
                      if (activeChat?.otherUser?.id) { blockUser(activeChat?.otherUser?.id); }
                      toast.success('Reported and blocked');
                      setShowChatMenu(false); 
                    }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Report</button>
                    {!activeChat?.isGroup && (
                      <button onClick={() => { blockUser(activeChat?.otherUser?.id); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Block</button>
                    )}
                    <button onClick={() => { clearChatMessages(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Clear chat</button>
                    <button onClick={() => { deleteChat(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-red-400">Delete chat</button>
"""
    lines = lines[:start_idx] + [new_menu] + lines[end_idx:]

# Update the chat list to show icons for muted/favourites
for i, line in enumerate(lines):
    if '                    <span className={`text-[11px] font-medium ${chat.isGroup || chat.otherUser?.isOnline ? \'text-[#00A884]\' : \'text-[#8696a0]\'}`}>' in line:
        lines[i] = '                    <span className={`text-[11px] font-medium ${chat.isGroup || chat.otherUser?.isOnline ? \'text-[#00A884]\' : \'text-[#8696a0]\'} flex items-center gap-1`}>\n'
        # Check where to insert the icons
    if '                      {chat.isGroup ? `${chat.description || \'Group\'}` : (!chat.otherUser ? \'Message yourself\' : (chat.otherUser.isOnline ? \'Online\' : \'Offline\'))}' in line:
        lines[i] = line + """
                      {mutedChats.includes(chat.chatId) && <Bell size={10} className="text-[#8696A0] opacity-50" />}
                      {favouriteChats.includes(chat.chatId) && <Star size={10} className="text-[#ffd279]" />}
"""

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Features patched")
