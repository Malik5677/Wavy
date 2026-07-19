import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

start_msg = content.find('messages.map((msg, index) => {')
end_msg = content.find('</div>', content.find('return (', start_msg) + 500) # Get a chunk

print(content[start_msg:end_msg+500])
