import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Replace sidebar active tab background
content = content.replace("bg-gray-800 text-white", "bg-[#202C33] text-[#E9EDEF]")
content = content.replace("hover:bg-gray-800", "hover:bg-[#202C33]")

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
