import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Greens for primary actions
content = content.replace('bg-blue-500', 'bg-[#00A884]')
content = content.replace('shadow-blue-500/20', 'shadow-[#00A884]/20')
content = content.replace('hover:bg-blue-600', 'hover:bg-[#06CF9C]')
content = content.replace('text-blue-500', 'text-[#00A884]')
content = content.replace('text-blue-600', 'text-[#00A884]')
content = content.replace('text-[#60A5FA]', 'text-[#00A884]')
content = content.replace('text-[#93C5FD]', 'text-[#00A884]')

# Update the chips on the sidebar (All, Unread, Favourites, Groups)
# Let's see what classes they use. Wait, are they in the code?
