with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const [activeTab, setActiveTab]" in line:
        insert_idx = i
        break

new_state = """  const [privacyLastSeen, setPrivacyLastSeen] = useState(user?.privacyLastSeen || 'everyone');
  const [privacyProfilePhoto, setPrivacyProfilePhoto] = useState(user?.privacyProfilePhoto || 'everyone');
  const [privacyStatus, setPrivacyStatus] = useState(user?.privacyStatus || 'everyone');
  const [wallpaper, setWallpaper] = useState(user?.wallpaper || '');
  
  const saveSettings = async () => {
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          privacyLastSeen,
          privacyProfilePhoto,
          privacyStatus,
          wallpaper
        })
      });
      if (res.ok) {
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };
"""

new_lines = lines[:insert_idx] + [new_state + "\n"] + lines[insert_idx:]

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(new_lines)
print("State patched")
