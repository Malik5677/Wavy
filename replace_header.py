with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '                <button onClick={() => toast.success(\'Viewing chat info...\')} className="hover:text-[#00A884] transition-colors"><Info size={20} /></button>' in line:
        start_idx = i - 1  # include the divider maybe?
        break

if start_idx != -1:
    end_idx = start_idx + 1

if start_idx != -1:
    new_code = """                <button onClick={() => setShowChatMenu(!showChatMenu)} className={`hover:text-[#E9EDEF] transition-colors relative z-20 ${showChatMenu ? 'bg-[#374045] rounded-full p-1 -m-1 text-[#E9EDEF]' : 'p-1 -m-1'}`}>
                  <MoreVertical size={20} />
                </button>
                {showChatMenu && (
                  <div className="absolute right-6 top-16 w-56 bg-[#233138] rounded-md shadow-lg py-2 z-50 text-[#E9EDEF] shadow-black/50 text-sm">
                    <button onClick={() => { setShowContactInfo(true); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Contact info</button>
                    <button onClick={() => { setIsChatSearchOpen(true); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Search</button>
                    <button onClick={() => { setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Select messages</button>
                    <button onClick={() => { setActiveChat(null); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Close chat</button>
                    {!activeChat?.isGroup && (
                      <button onClick={() => { blockUser(activeChat?.otherUser?.id); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Block</button>
                    )}
                    <button onClick={() => { clearChatMessages(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition">Clear chat</button>
                    <button onClick={() => { deleteChat(activeChat?.chatId); setShowChatMenu(false); }} className="w-full text-left px-6 py-3 hover:bg-[#182229] transition text-red-500">Delete chat</button>
                  </div>
                )}
"""
    lines[start_idx] = new_code
    del lines[start_idx+1:end_idx+1]
    
    with open('src/pages/Home.tsx', 'w') as f:
        f.writelines(lines)
    print("Header patched")
else:
    print("Could not find header lines")
