import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Fix broken double classes
content = content.replace('text-[#00A884] text-[#00A884]', 'text-[#00A884]')
content = content.replace('text-[#AEBAC1] text-gray-500', 'text-[#8696A0]')
content = content.replace('text-[#E9EDEF] font-medium font-medium', 'text-[#E9EDEF] font-medium')
content = content.replace('text-gray-100 placeholder-gray-500 placeholder-gray-400', 'text-[#E9EDEF] placeholder-[#8696A0]')
content = content.replace('text-gray-800 text-[#d1d7db]', 'text-[#E9EDEF]')
content = content.replace('hover:text-gray-600 hover:text-gray-300', 'hover:text-[#E9EDEF]')
content = content.replace('hover:text-gray-600', 'hover:text-[#E9EDEF]')
content = content.replace('hover:text-gray-700', 'hover:text-[#E9EDEF]')
content = content.replace('hover:text-gray-800', 'hover:text-[#E9EDEF]')
content = content.replace('hover:bg-gray-200', 'hover:bg-[#374045]')
content = content.replace('bg-gray-200', 'bg-[#374045]')
content = content.replace('bg-gray-300', 'bg-[#374045]')
content = content.replace('text-gray-300', 'text-[#8696A0]')
content = content.replace('text-gray-400', 'text-[#8696A0]')
content = content.replace('bg-gray-400', 'bg-[#8696A0]')

# Check for Empty state background 
content = content.replace('<main className="flex-1 flex flex-col bg-[#0B141A] relative shadow-inner">', '<main className="flex-1 flex flex-col bg-[#222E35] relative shadow-inner">')
# but wait! Active chats also use <main>, so we should conditionally set background.
# Actually WhatsApp sets bg for empty state differently.
# I will do a dynamic bg class replacement for the main element:
content = content.replace('<main className="flex-1 flex flex-col bg-[#222E35] relative shadow-inner">', '<main className={`flex-1 flex flex-col relative shadow-inner ${activeChat ? \'bg-[#0B141A]\' : \'bg-[#222E35]\'}`}>')
content = content.replace('<main className="flex-1 flex flex-col bg-[#0B141A] relative shadow-inner">', '<main className={`flex-1 flex flex-col relative shadow-inner ${activeChat ? \'bg-[#0B141A]\' : \'bg-[#222E35]\'}`}>')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
