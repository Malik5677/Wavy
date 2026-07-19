with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "                  <div className=\"absolute right-6 top-16 w-56 bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm\">" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "                  </div>" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_menu = """                  <div className="absolute right-6 top-16 w-[220px] bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm flex flex-col">
                    <button onClick={() => { setShowContactInfo(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Contact info</button>
                    <button onClick={() => { setIsChatSearchOpen(true); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Search</button>
                    <button onClick={() => { toast.success('Select messages'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Select messages</button>
                    <button onClick={() => { toast.success('Mute notifications'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition flex justify-between items-center">Mute notifications <ChevronRight size={16} /></button>
                    <button onClick={() => { toast.success('Disappearing messages'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Disappearing messages</button>
                    <button onClick={() => { toast.success('Add to favourites'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Add to favourites</button>
                    <button onClick={() => { toast.success('Add to list'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition flex justify-between items-center">Add to list <ChevronRight size={16} /></button>
                    <button onClick={() => { setActiveChat(null); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Close chat</button>
                    <button onClick={() => { toast.success('Send call link'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Send call link</button>
                    <button onClick={() => { toast.success('Report'); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Report</button>
                    {!activeChat?.isGroup && (
                      <button onClick={() => { blockUser(activeChat?.otherUser?.id); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Block</button>
                    )}
                    <button onClick={() => { clearChatMessages(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Clear chat</button>
                    <button onClick={() => { deleteChat(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition">Delete chat</button>
"""
    lines = lines[:start_idx] + [new_menu] + lines[end_idx:]
    with open('src/pages/Home.tsx', 'w') as f:
        f.writelines(lines)
    print("Menu updated")
else:
    print("Could not find menu")
