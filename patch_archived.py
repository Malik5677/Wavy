with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

new_header = """            <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-6 text-[#E9EDEF]">
                <button onClick={() => setShowArchived(false)} className="hover:bg-[#374045] p-2 -ml-2 rounded-full transition">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-[19px] font-semibold tracking-tight">Archived</h1>
              </div>
            </header>"""

for i, line in enumerate(lines):
    if "{activeTab === 'chats' && showArchived && (" in line:
        start_idx = i + 2
        end_idx = i + 9
        del lines[start_idx:end_idx]
        lines.insert(start_idx, new_header + "\n")
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched archived header")
