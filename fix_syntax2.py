import re

with open('src/server/chat.ts', 'r') as f:
    content = f.read()

# Just remove the loose `}); }` before res.json
content = re.sub(r'\}\)\);\s*\}\);\s*\}\s*res\.json\(chatMsgs\);', '}));\n    \n    res.json(chatMsgs);', content)

with open('src/server/chat.ts', 'w') as f:
    f.write(content)
print("Fixed syntax 2")
