with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const [showChatMenu, setShowChatMenu] = useState(false);" in line:
        lines.insert(i + 1, "  const [showChatsMenu, setShowChatsMenu] = useState(false);\n")
        break

for i, line in enumerate(lines):
    if "setShowChatMenu(false);" in line and "setContextMenu(null);" in lines[i-1]:
        lines.insert(i + 1, "      setShowChatsMenu(false);\n")
        break

# Find the menu button
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '<button className="text-[#AEBAC1] hover:bg-[#202C33] p-2 rounded-lg transition-colors" title="Menu">' in line:
        start_idx = i
        end_idx = i + 3
        break

new_menu = """                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowChatsMenu(!showChatsMenu); }} className={`hover:bg-[#202C33] p-2 rounded-lg transition-colors ${showChatsMenu ? 'bg-[#202C33] text-[#E9EDEF]' : 'text-[#AEBAC1]'}`} title="Menu">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>
                    </button>
                    {showChatsMenu && (
                      <div className="absolute right-0 top-12 w-48 bg-[#233138] shadow-[0_2px_5px_0_rgba(11,20,26,.26),0_2px_10px_0_rgba(11,20,26,.16)] rounded-sm py-2 z-50 text-[#E9EDEF]">
                        <button onClick={() => { setShowArchived(true); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Archived</button>
                        <button onClick={() => { setActiveTab('settings'); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Settings</button>
                        <button onClick={() => { handleLogout(); setShowChatsMenu(false); }} className="w-full text-left px-5 py-3 hover:bg-[#182229] transition text-[14.5px]">Log out</button>
                      </div>
                    )}
                  </div>\n"""

if start_idx != -1:
    del lines[start_idx:end_idx]
    lines.insert(start_idx, new_menu)

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched chats menu")
