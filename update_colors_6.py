import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Replace any remaining blue with green
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
content = content.replace('text-green-800', 'text-[#00A884]')
content = content.replace('focus:ring-blue-500', 'focus:ring-[#00A884]')
content = content.replace('border-blue-500', 'border-[#00A884]')
content = content.replace('border-green-500', 'border-[#00A884]')

# Replace "W" icon with something more fitting, or just keep it green
content = content.replace('bg-[#00A884] rounded-xl flex items-center justify-center text-white font-bold text-xl', 'bg-[#00A884] rounded-full flex items-center justify-center text-[#111B21] font-bold text-xl')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
