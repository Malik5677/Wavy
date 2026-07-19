import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Fix background
content = content.replace('bg-[#EFEAE2] dark:bg-[#0b141a]', 'bg-[#0B141A]')

# Fix encryption message
content = content.replace('bg-[#FFEECD] dark:bg-[#182229]', 'bg-[#182229]')
content = content.replace('text-[#543b15] dark:text-[#ffd279]', 'text-[#ffd279]')
content = content.replace('text-[#7a5a22] dark:text-[#ffd279]', 'text-[#ffd279]')

# Fix dark mode specific classes that I missed
content = content.replace('dark:bg-[#111b21]', 'bg-[#111B21]')
content = content.replace('dark:text-[#e9edef]', 'text-[#E9EDEF]')
content = content.replace('dark:text-[#aebac1]', 'text-[#AEBAC1]')
content = content.replace('dark:border-[#2a3942]', 'border-[#222E35]')
content = content.replace('dark:bg-[#202c33]', 'bg-[#202C33]')
content = content.replace('dark:text-[#8696a0]', 'text-[#8696a0]')
content = content.replace('dark:hover:bg-[#202c33]', 'hover:bg-[#202C33]')
content = content.replace('dark:bg-[#2a3942]', 'bg-[#2A3942]')
content = content.replace('dark:bg-[#00a884]', 'bg-[#00A884]')
content = content.replace('dark:border-transparent', 'border-transparent')
content = content.replace('dark:bg-[#005c4b]', 'bg-[#005C4B]')
content = content.replace('dark:border-[#374045]', 'border-[#374045]')
content = content.replace('dark:bg-[#0b141a]', 'bg-[#0B141A]')
content = content.replace('dark:text-[#00a884]', 'text-[#00A884]')
content = content.replace('dark:text-[#60a5fa]', 'text-[#60A5FA]')
content = content.replace('dark:text-[#93c5fd]', 'text-[#93C5FD]')
content = content.replace('dark:bg-[#00a884]/20', 'bg-[#00A884]/20')
content = content.replace('dark:divide-[#2a3942]', 'divide-[#222E35]')
content = content.replace('dark:text-[#ffd279]', 'text-[#FFD279]')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
