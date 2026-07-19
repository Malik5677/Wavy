import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Replace specific colors
content = content.replace('bg-[#F0F2F5] dark:bg-[#111b21]', 'bg-[#111B21]')
content = content.replace('text-[#111B21] dark:text-[#e9edef]', 'text-[#e9edef]')
content = content.replace('bg-[#111B21]', 'bg-[#0B141A]') # Left nav rail
content = content.replace('text-gray-400', 'text-[#AEBAC1]')

# Header
content = content.replace('bg-white dark:bg-[#202c33]', 'bg-[#202c33]')
content = content.replace('text-gray-500 dark:text-[#aebac1]', 'text-[#aebac1]')
content = content.replace('border-gray-200 dark:border-[#2a3942]', 'border-[#222E35]')
content = content.replace('bg-gray-100 dark:bg-[#202c33]', 'bg-[#202C33]')

# Text
content = content.replace('text-gray-900 dark:text-[#e9edef]', 'text-[#e9edef]')
content = content.replace('text-gray-500 dark:text-[#8696a0]', 'text-[#8696a0]')

# Chat items
content = content.replace('hover:bg-gray-50 dark:hover:bg-[#202c33]', 'hover:bg-[#202C33]')
content = content.replace('bg-blue-50 dark:bg-[#2a3942]', 'bg-[#2A3942]')

# Unread badge
content = content.replace('bg-blue-600 dark:bg-[#00a884] text-white', 'bg-[#00a884] text-[#111B21]')
content = content.replace('bg-blue-600 dark:bg-[#00a884]', 'bg-[#00A884]')

# Bubbles
content = content.replace('bg-white dark:bg-[#202c33] border-gray-100 dark:border-transparent', 'bg-[#202C33]')
content = content.replace('bg-blue-600 dark:bg-[#005c4b] text-white', 'bg-[#005C4B] text-[#E9EDEF]')
content = content.replace('bg-blue-600 dark:bg-[#005c4b]', 'bg-[#005C4B]')
content = content.replace('text-blue-100 dark:text-[#8696a0]', 'text-[#8696a0]')

# Search bar
content = content.replace('bg-gray-100 dark:bg-[#202c33]', 'bg-[#202C33]')
content = content.replace('bg-gray-200 dark:bg-[#2a3942]', 'bg-[#2A3942]')

# General borders
content = content.replace('border-gray-100 dark:border-[#2a3942]', 'border-[#222E35]')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
