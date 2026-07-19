with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<div className="font-medium text-[#E9EDEF]">{u.displayName || u.phoneNumber}</div>' in line:
        lines[i] = '                        <div className="font-medium text-[#E9EDEF]">{getUserDisplayInfo(u).name}</div>\n'
    elif '                          {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : user.displayName ? user.displayName[0].toUpperCase() : \'U\'}\n' in line and '<h2 className="text-[#E9EDEF] text-[17px]">{user.displayName || user.username}</h2>' in lines[i+3]:
        lines[i] = '                          {getUserDisplayInfo(user).photo ? <img src={getUserDisplayInfo(user).photo} className="w-full h-full object-cover" /> : getUserDisplayInfo(user).name[0].toUpperCase()}\n'
        lines[i+3] = '                          <h2 className="text-[#E9EDEF] text-[17px]">{getUserDisplayInfo(user).name}</h2>\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched search results")
