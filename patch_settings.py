with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "        {activeTab === 'settings' && (" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "        )}" in lines[i] and i > start_idx + 50:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_settings = """        {activeTab === 'settings' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[108px] bg-[#202C33] flex flex-col justify-end px-6 pb-4 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center text-[#E9EDEF]">
                <h1 className="text-[19px] font-semibold tracking-tight">Settings</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-8 cursor-pointer hover:bg-[#202C33] p-4 -mx-4 rounded-xl transition" onClick={() => setShowProfileModal(true)}>
                  <div className="w-16 h-16 bg-[#374045] rounded-full flex items-center justify-center text-[#E9EDEF] text-xl font-bold overflow-hidden shadow-lg">
                    {user?.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : ((user?.displayName || user?.username) ? (user.displayName || user.username)[0].toUpperCase() : <UserIcon size={32} className="text-[#AEBAC1]"/>)}
                  </div>
                  <div>
                    <h2 className="text-[#E9EDEF] text-xl mb-1">{user?.displayName || user?.username || 'Set Name'}</h2>
                    <p className="text-[#8696A0] text-sm">{user?.bio || 'Available'}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <UserIcon size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Account</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-privacy')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Lock size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Privacy</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-chats')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <MessageCircle size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Chats</div>
                  </div>
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Bell size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Notifications</div>
                  </div>
                  <div onClick={() => setActiveTab('settings-blocked')} className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <Shield size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Blocked Contacts</div>
                  </div>
                  <div className="flex items-center gap-6 p-4 hover:bg-[#202C33] rounded-xl cursor-pointer text-[#E9EDEF] transition group">
                    <HelpCircle size={20} className="text-[#8696A0] group-hover:text-[#E9EDEF]" />
                    <div className="flex-1 border-b border-[#2A3942] pb-4">Help</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-privacy' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[108px] bg-[#202C33] flex flex-col justify-end px-6 pb-4 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Privacy</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 text-[#E9EDEF]">
              <div className="mb-6">
                <h3 className="text-[#00A884] text-sm font-semibold mb-4">Who can see my personal info</h3>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Last seen</p>
                  <select 
                    value={privacyLastSeen} 
                    onChange={(e) => setPrivacyLastSeen(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Profile Photo</p>
                  <select 
                    value={privacyProfilePhoto} 
                    onChange={(e) => setPrivacyProfilePhoto(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Status</p>
                  <select 
                    value={privacyStatus} 
                    onChange={(e) => setPrivacyStatus(e.target.value)}
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <button 
                  onClick={saveSettings}
                  className="mt-4 bg-[#00A884] text-[#111B21] px-4 py-2 rounded-lg font-semibold hover:bg-[#008f6f] transition"
                >
                  Save Privacy Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-chats' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[108px] bg-[#202C33] flex flex-col justify-end px-6 pb-4 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Chats</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 text-[#E9EDEF]">
              <div className="mb-6">
                <h3 className="text-[#00A884] text-sm font-semibold mb-4">Display</h3>
                
                <div className="mb-4">
                  <p className="text-sm mb-2 text-[#8696A0]">Chat Wallpaper URL</p>
                  <input 
                    type="text"
                    value={wallpaper}
                    onChange={(e) => setWallpaper(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-[#202C33] text-[#E9EDEF] p-3 rounded-xl border border-[#2A3942] focus:outline-none focus:border-[#00A884]"
                  />
                  <p className="text-xs text-[#8696A0] mt-2">Leave blank for default</p>
                </div>

                <button 
                  onClick={saveSettings}
                  className="mt-4 bg-[#00A884] text-[#111B21] px-4 py-2 rounded-lg font-semibold hover:bg-[#008f6f] transition"
                >
                  Save Chat Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings-blocked' && (
          <div className="flex flex-col h-full bg-[#111B21]">
            <header className="h-[108px] bg-[#202C33] flex flex-col justify-end px-6 pb-4 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
              <div className="flex items-center gap-4 text-[#E9EDEF]">
                <button onClick={() => setActiveTab('settings')} className="hover:bg-[#374045] p-2 rounded-full transition"><ArrowLeft size={20} /></button>
                <h1 className="text-[19px] font-semibold tracking-tight">Blocked Contacts</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 text-[#E9EDEF]">
              {blockedUsers.length === 0 ? (
                <p className="text-[#8696A0] text-center mt-10">No blocked contacts.</p>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-4 bg-[#202C33] p-4 rounded-xl">
                      <div className="w-12 h-12 bg-[#374045] rounded-full flex items-center justify-center overflow-hidden">
                        {u.profilePhoto ? <img src={u.profilePhoto} className="w-full h-full object-cover"/> : <UserIcon className="text-[#8696A0]"/>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#E9EDEF]">{u.displayName || u.username || u.phoneNumber}</p>
                      </div>
                      <button 
                        onClick={() => unblockUser(u.id)}
                        className="bg-[#374045] hover:bg-[#2A3942] px-4 py-2 rounded-lg text-[#00A884] font-medium transition"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
"""
    
    new_lines = lines[:start_idx] + [new_settings + "\n"] + lines[end_idx+1:]
    
    with open('src/pages/Home.tsx', 'w') as f:
        f.writelines(new_lines)
    print(f"Replaced {end_idx - start_idx + 1} lines")
else:
    print(f"Failed to find indices. Start: {start_idx}, End: {end_idx}")

