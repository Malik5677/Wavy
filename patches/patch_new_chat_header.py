with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "New chat</h1>" in line and "ArrowLeft" in lines[i-2]:
        lines[i-3] = '              <div className="flex items-center gap-6 text-[#E9EDEF]">\n'
        lines[i-2] = '                <button onClick={() => setActiveTab(\'chats\')} className="hover:bg-[#374045] p-2 -ml-2 rounded-full transition">\n'
        lines[i-1] = '                  <ArrowLeft size={20} />\n'
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched new chat header")
