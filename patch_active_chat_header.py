with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{activeChat.avatar ? <img src={activeChat.avatar}' in line:
        lines[i] = '                  {(!activeChat.isGroup && activeChat.otherUser) ? (getUserDisplayInfo(activeChat.otherUser).photo ? <img src={getUserDisplayInfo(activeChat.otherUser).photo} className="w-full h-full object-cover" /> : (getUserDisplayInfo(activeChat.otherUser).name[0].toUpperCase())) : (activeChat.avatar ? <img src={activeChat.avatar} className="w-full h-full object-cover" /> : (activeChat.name ? activeChat.name[0].toUpperCase() : <UserIcon size={20}/>))}\n'
    elif '<h2 className="font-bold text-[15px] leading-tight">{activeChat.name || \'Unknown\'}</h2>' in line:
        lines[i] = '                  <h2 className="font-bold text-[15px] leading-tight">{!activeChat.isGroup && activeChat.otherUser ? getUserDisplayInfo(activeChat.otherUser).name : (activeChat.name || \'Unknown\')}</h2>\n'
    elif '<h2 className="text-[24px] text-[#E9EDEF] font-normal text-center mb-1">{activeChat.name || \'Unknown\'}</h2>' in line:
        lines[i] = '              <h2 className="text-[24px] text-[#E9EDEF] font-normal text-center mb-1">{!activeChat.isGroup && activeChat.otherUser ? getUserDisplayInfo(activeChat.otherUser).name : (activeChat.name || \'Unknown\')}</h2>\n'
    elif '<p className="text-[16px] text-[#8696a0]">@{activeChat.otherUser.username}</p>' in line or ('<p className="text-[16px] text-[#8696a0]">' in line and '@' in lines[i+1]):
        pass # Will handle the bio section next

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched active chat header")
