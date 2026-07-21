with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{/* About / Info Section */}' in line:
        start_idx = i - 13
        end_idx = i + 15
        
        new_section = """            {/* Profile Section */}
            <div className="bg-[#111B21] flex flex-col items-center pt-8 pb-6 px-4 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)]">
              <div className="w-[200px] h-[200px] rounded-full overflow-hidden mb-6 bg-[#374045] flex items-center justify-center font-bold text-6xl text-[#E9EDEF]">
                {(!activeChat.isGroup && activeChat.otherUser) ? (getUserDisplayInfo(activeChat.otherUser).photo ? <img src={getUserDisplayInfo(activeChat.otherUser).photo} className="w-full h-full object-cover" /> : (getUserDisplayInfo(activeChat.otherUser).name[0].toUpperCase())) : (activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : (activeChat.name ? activeChat.name[0].toUpperCase() : <UserIcon size={100}/>))}
              </div>
              <h2 className="text-[24px] text-[#E9EDEF] font-normal text-center mb-1">{!activeChat.isGroup && activeChat.otherUser ? getUserDisplayInfo(activeChat.otherUser).name : (activeChat.name || 'Unknown')}</h2>
              {!activeChat.isGroup && activeChat.otherUser && !getUserDisplayInfo(activeChat.otherUser).isSaved && activeChat.otherUser.displayName && (
                <p className="text-[18px] text-[#8696a0] mb-1">~{activeChat.otherUser.displayName}</p>
              )}
              {!activeChat.isGroup && activeChat.otherUser && activeChat.otherUser.username && (
                <p className="text-[16px] text-[#8696a0]">
                  @{activeChat.otherUser.username}
                </p>
              )}
            </div>

            {/* About / Info Section */}
            {!activeChat.isGroup && activeChat.otherUser && (
              <div className="bg-[#111B21] py-4 px-8 mb-2 shadow-[0_1px_3px_rgba(11,20,26,0.1)] flex flex-col gap-4">
                {activeChat.otherUser.phoneNumber && (
                  <div>
                    <p className="text-[14px] text-[#8696a0] mb-1">Phone number</p>
                    <p className="text-[17px] text-[#E9EDEF]">{activeChat.otherUser.phoneNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-[14px] text-[#8696a0] mb-1">About</p>
                  <p className="text-[17px] text-[#E9EDEF]">{activeChat.otherUser.bio || 'Available'}</p>
                </div>
              </div>
            )}\n"""
        
        del lines[start_idx:end_idx]
        lines.insert(start_idx, new_section)
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched info section")
