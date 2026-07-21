with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'defaultValue={user?.displayName || user?.username}' in line:
        lines[i] = '                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={profileForm.displayName} placeholder="Enter your name" onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})} />\n'
    elif 'defaultValue={user?.bio}' in line:
        lines[i] = '                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={profileForm.bio} placeholder="Available" onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} />\n'
    elif 'onClick={() => setShowProfileModal(false)}' in line and 'Save Changes' in lines[i+1]:
        lines[i] = '              <button onClick={handleSaveProfile} className="mt-4 bg-[#00A884] hover:bg-[#029676] text-[#111B21] font-medium py-3 rounded-xl transition">\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched profile form inputs")
