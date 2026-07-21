with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

new_chat_jsx = """        {activeTab === 'new-chat' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[108px] bg-[#202C33] flex flex-col justify-end px-6 pb-4 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center text-[#E9EDEF]">
                <button onClick={() => setActiveTab('chats')} className="mr-6 hover:text-white transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-[19px] font-semibold tracking-tight">New chat</h1>
              </div>
            </header>
            
            <div className="p-2 border-b border-[#222E35] bg-[#111B21]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search contacts" 
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full bg-[#202C33] border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-0 outline-none placeholder-[#8696A0] text-[#e9edef]"
                />
                <svg className="w-4 h-4 text-[#8696A0] absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!searchQuery && (
                <div className="py-2">
                  <div className="flex items-center gap-4 px-4 py-3 hover:bg-[#202C33] cursor-pointer transition" onClick={() => toast('New group feature coming soon')}>
                    <div className="w-12 h-12 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
                      <Users size={24} />
                    </div>
                    <div className="flex-1 border-b border-[#222E35] pb-3 pt-1">
                      <h2 className="text-[#E9EDEF] text-base">New group</h2>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="py-2">
                {searchResults.length > 0 ? (
                  <>
                    <h3 className="px-4 py-2 text-[#00A884] text-sm font-medium tracking-wide">CONTACTS ON WAVECHAT</h3>
                    {searchResults.map(user => (
                      <div key={user.id} onClick={() => { startChat(user.id); setActiveTab('chats'); }} className="flex items-center gap-4 px-4 py-3 hover:bg-[#202C33] cursor-pointer transition">
                        <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center text-[#E9EDEF] font-bold overflow-hidden shrink-0">
                          {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 border-b border-[#222E35] pb-3 pt-1">
                          <h2 className="text-[#E9EDEF] text-[17px]">{user.displayName || user.username}</h2>
                          <p className="text-sm text-[#8696A0] truncate">{user.bio || 'Hey there! I am using WaveChat.'}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchQuery ? (
                  <div className="text-center text-[#8696a0] mt-10">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
"""

for i, line in enumerate(lines):
    if "{activeTab === 'calls' && (" in line:
        lines.insert(i, new_chat_jsx + "\n")
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched new chat sidebar")
