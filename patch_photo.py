with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const [profileForm, setProfileForm] = useState({ displayName:' in line:
        lines[i] = '  const [profileForm, setProfileForm] = useState({ displayName: user?.displayName || user?.username || \'\', bio: user?.bio || \'\', profilePhoto: user?.profilePhoto || \'\' });\n'
    elif 'setProfileForm({ displayName: user.displayName' in line:
        lines[i] = '      setProfileForm({ displayName: user.displayName || user.username || \'\', bio: user.bio || \'\', profilePhoto: user.profilePhoto || \'\' });\n'
    elif '<Camera size={32} className="text-white" />' in line:
        lines[i] = '                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">\n                      <Camera size={32} className="text-white" />\n                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {\n                        const file = e.target.files?.[0];\n                        if (file) {\n                          const reader = new FileReader();\n                          reader.onloadend = () => {\n                            setProfileForm({ ...profileForm, profilePhoto: reader.result as string });\n                          };\n                          reader.readAsDataURL(file);\n                        }\n                      }} />\n                    </label>\n'
    elif '{user?.profilePhoto ? <img src={user.profilePhoto}' in line and '<Camera' in lines[i+2]:
        lines[i] = '                  {profileForm.profilePhoto ? <img src={profileForm.profilePhoto} className="w-full h-full object-cover" /> : (user?.displayName || user?.username)?.[0]?.toUpperCase()}\n'

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched photo upload")
