import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

content = content.replace('bg-blue-500', 'bg-[#00A884]')
content = content.replace('shadow-blue-500/20', 'shadow-[#00A884]/20')
content = content.replace('hover:bg-blue-600', 'hover:bg-[#06CF9C]')
content = content.replace('text-blue-500', 'text-[#00A884]')
content = content.replace('text-blue-600', 'text-[#00A884]')
content = content.replace('text-[#60a5fa]', 'text-[#00A884]')
content = content.replace('text-[#93c5fd]', 'text-[#00A884]')
content = content.replace('bg-blue-100', 'bg-[#00A884]/20')
content = content.replace('text-blue-700', 'text-[#00A884]')
content = content.replace('bg-[#60a5fa]', 'bg-[#00A884]')
content = content.replace('bg-blue-600', 'bg-[#00A884]')
content = content.replace('text-green-600', 'text-[#00A884]')
content = content.replace('text-green-500', 'text-[#00A884]')
content = content.replace('bg-green-500', 'bg-[#00A884]')

# Update green chips logic if there are any chips using green text
content = content.replace('text-green-800', 'text-[#00A884]')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
