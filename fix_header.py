with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

content = content.replace("            </header>\n            {/* Message Area */}", "            </header>\n            )}\n            {/* Message Area */}")

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Header fixed 2")
