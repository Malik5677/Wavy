import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Define the start and end of the footer content
footer_start_tag = '<footer className="bg-[#202c33] p-4 flex items-center space-x-3 border-t border-[#222E35] relative">'
footer_end_tag = '</footer>'

start_idx = content.find(footer_start_tag)
if start_idx == -1:
    print("Could not find footer start")
    exit(1)

# We need to find the matching closing tag. 
# There's another </footer> later for status, but this one is before the `</>` of the chat view.
# Let's use regex or string methods.
end_idx = content.find('</footer>\n          </>', start_idx)
if end_idx == -1:
    end_idx = content.find('</footer>\n          <', start_idx)

if end_idx == -1:
    print("Could not find footer end")
    exit(1)

end_idx += len('</footer>')

old_footer_full = content[start_idx:end_idx]

# Extract inner content
inner_content = old_footer_full[len(footer_start_tag):-len('</footer>')]

new_footer_full = f"""{footer_start_tag}
              {{(() => {{
                const isBlockedByMe = activeChat && !activeChat.isGroup && activeChat.otherUser && blockedUsers.some(u => u.id === activeChat.otherUser.id);
                if (isBlockedByMe) {{
                  return (
                    <div className="flex-1 flex justify-center text-sm text-[#8696a0]">
                      <button onClick={{() => unblockUser(activeChat.otherUser.id)}} className="hover:underline text-[#00A884]">You blocked this contact. Tap to unblock.</button>
                    </div>
                  );
                }}
                return (
                  <>{inner_content}</>
                );
              }})()}}
            </footer>"""

content = content[:start_idx] + new_footer_full + content[end_idx:]

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Patched footer input")
