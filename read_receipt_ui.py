with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

start = content.find(' {/* Chat Feed */}')
end = content.find(' {/* Message Input */}', start)

print(content[start:end])
