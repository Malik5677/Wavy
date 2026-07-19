import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Get the chat feed rendering part
start_feed = content.find('<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2]">')
end_feed = content.find(' {/* Message Input */}', start_feed)

print("--- FEED ---")
print(content[start_feed:end_feed])

start_input = content.find('{/* Message Input */}')
end_input = content.find('</main>', start_input)

print("--- INPUT ---")
print(content[start_input:end_input])
