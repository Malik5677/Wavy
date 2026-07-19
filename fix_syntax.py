import re

with open('src/server/chat.ts', 'r') as f:
    content = f.read()

bad_block = """    }));
    
      });
    }

    res.json(chatMsgs);"""

good_block = """    }));
    
    res.json(chatMsgs);"""

content = content.replace(bad_block, good_block)

with open('src/server/chat.ts', 'w') as f:
    f.write(content)
print("Fixed syntax")
