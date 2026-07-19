import re

with open('src/components/CommunityView.tsx', 'r') as f:
    content = f.read()

# Replace light mode colors with the hardcoded dark mode ones from Home.tsx
replacements = {
    'bg-gray-50 dark:bg-[#202c33]': 'bg-[#111B21]',
    'bg-white dark:bg-[#2a3942]': 'bg-[#202C33]',
    'border-gray-200 dark:border-[#2a3942]': 'border-[#222E35]',
    'hover:bg-gray-50 dark:bg-[#202c33]': 'hover:bg-[#202C33]',
    'bg-gray-200 dark:bg-[#374045]': 'bg-[#374045]',
    'text-gray-500 dark:text-[#8696a0]': 'text-[#8696A0]',
    'text-gray-900 dark:text-[#e9edef]': 'text-[#E9EDEF]',
    'text-gray-400 dark:text-[#8696a0]': 'text-[#8696A0]',
    'bg-white dark:bg-[#202c33]': 'bg-[#111B21]',
    'border-gray-100 dark:border-[#202c33]': 'border-[#222E35]',
    'text-gray-700 dark:text-[#e9edef]': 'text-[#E9EDEF]',
    'border-gray-300 dark:border-[#374045]': 'border-[#374045]',
    'text-gray-600 dark:text-[#8696a0]': 'text-[#8696A0]',
    'hover:bg-gray-200 dark:bg-[#374045]': 'hover:bg-[#374045]'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/components/CommunityView.tsx', 'w') as f:
    f.write(content)
