with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "                  <motion.div " in line:
        insert_idx = i
        # Replace it with logic that handles isSelectingMessages
        lines[i] = """                  <motion.div 
                    onClick={() => {
                      if (isSelectingMessages) {
                        setSelectedMessages(prev => prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]);
                      }
                    }}
"""
    if "                    className={`flex items-end max-w-[70%] relative group ${isMe ? 'self-end' : ''}`}" in line:
        lines[i] = "                    className={`flex items-end max-w-[70%] relative group ${isMe ? 'self-end' : ''} ${isSelectingMessages ? 'cursor-pointer hover:opacity-80' : ''}`}\n"
        
    if "                      <div className=\"flex items-end\">" in line:
        lines[i] = """                      {isSelectingMessages && (
                        <div className={`w-4 h-4 rounded-full border border-[#8696A0] mr-2 flex items-center justify-center shrink-0 self-center ${selectedMessages.includes(msg.id) ? 'bg-[#00A884] border-[#00A884]' : ''}`}>
                          {selectedMessages.includes(msg.id) && <Check size={12} className="text-white" />}
                        </div>
                      )}
                      <div className="flex items-end">
"""

# Now add a header for when selecting messages
for i, line in enumerate(lines):
    if "            {/* Header */}" in line:
        header_start = i
        lines[i] = """            {/* Header */}
            {isSelectingMessages ? (
              <header className="h-[64px] bg-[#202c33] border-b border-[#222E35] flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setIsSelectingMessages(false); setSelectedMessages([]); }} className="text-[#AEBAC1] hover:text-[#E9EDEF]">
                    <X size={20} />
                  </button>
                  <span className="text-[#E9EDEF] font-medium">{selectedMessages.length} selected</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => toast.success('Messages forwarded')} className="text-[#AEBAC1] hover:text-[#E9EDEF]" disabled={selectedMessages.length === 0}>
                    <Forward size={20} />
                  </button>
                  <button onClick={() => { toast.success('Messages deleted'); setIsSelectingMessages(false); setSelectedMessages([]); }} className="text-[#AEBAC1] hover:text-[#E9EDEF]" disabled={selectedMessages.length === 0}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </header>
            ) : (
"""
        break

for i, line in enumerate(lines[header_start:]):
    if "            </header>" in line:
        lines[header_start + i] = "            </header>\n            )}\n"
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Selection patched")
