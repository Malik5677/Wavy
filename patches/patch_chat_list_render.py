with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{chat.avatar ? <img src={chat.avatar}' in line:
        lines[i] = '                          {(!chat.isGroup && chat.otherUser) ? (getUserDisplayInfo(chat.otherUser).photo ? <img src={getUserDisplayInfo(chat.otherUser).photo} className="w-full h-full rounded-full object-cover" /> : (getUserDisplayInfo(chat.otherUser).name[0].toUpperCase())) : (chat.avatar ? <img src={chat.avatar} className="w-full h-full rounded-full object-cover" /> : (chat.name ? chat.name[0].toUpperCase() : <UserIcon size={24}/>))}\n'
    elif '<h3 className="font-semibold text-[15px] truncate text-[#E9EDEF] font-medium">{chat.name || \'Unknown\'}</h3>' in line:
        lines[i] = '                          <h3 className="font-semibold text-[15px] truncate text-[#E9EDEF] font-medium">{!chat.isGroup && chat.otherUser ? getUserDisplayInfo(chat.otherUser).name : (chat.name || \'Unknown\')}</h3>\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched chat list rendering")
