with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

new_effect = """  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setShowChatMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
"""

# Find the old effect and remove it
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const handleClick = () => {" in line and "setContextMenu(null);" in lines[i+1]:
        start_idx = i - 1
        end_idx = i + 6
        break

if start_idx != -1:
    del lines[start_idx:end_idx]

# Insert after showChatMenu
for i, line in enumerate(lines):
    if "const [showChatMenu, setShowChatMenu] = useState(false);" in line:
        lines.insert(i + 1, new_effect)
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched click outside")
