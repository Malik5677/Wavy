with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const [showProfileModal, setShowProfileModal] = useState(false);' in line:
        lines.insert(i+1, "  const [showContactModal, setShowContactModal] = useState<{ isOpen: boolean, contactId: string, defaultName: string, customName: string }>({ isOpen: false, contactId: '', defaultName: '', customName: '' });\n")
        break

for i, line in enumerate(lines):
    if "const customName = prompt('Enter a name for this contact:', activeChat.otherUser.displayName || '');" in line:
        lines[i] = "                    setShowContactModal({ isOpen: true, contactId: activeChat.otherUser.id, defaultName: activeChat.otherUser.displayName || '', customName: activeChat.otherUser.displayName || '' });\n"
        lines[i+1] = "\n"

contact_modal_tsx = """
      {showContactModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111B21] w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-[#222E35]">
            <header className="px-6 py-4 border-b border-[#222E35] flex items-center justify-between">
              <h2 className="text-[#E9EDEF] text-xl font-medium">Add Contact</h2>
              <button onClick={() => setShowContactModal({ ...showContactModal, isOpen: false })} className="text-[#8696A0] hover:text-[#E9EDEF]">
                <X size={24} />
              </button>
            </header>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[#00A884] text-sm font-semibold mb-2 block">Name</label>
                <div className="flex items-center gap-4">
                   <UserIcon size={24} className="text-[#8696A0] shrink-0" />
                   <input type="text" className="w-full bg-transparent border-b-2 border-[#202C33] focus:border-[#00A884] text-[#E9EDEF] py-2 outline-none transition" value={showContactModal.customName} placeholder="Contact name" onChange={(e) => setShowContactModal({ ...showContactModal, customName: e.target.value })} autoFocus />
                </div>
              </div>
              
              <button onClick={() => {
                if (showContactModal.customName.trim()) {
                  saveContact(showContactModal.contactId, showContactModal.customName.trim());
                  setShowContactModal({ ...showContactModal, isOpen: false });
                }
              }} className="mt-2 bg-[#00A884] hover:bg-[#029676] text-[#111B21] font-medium py-3 rounded-xl transition">
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
"""

for i, line in enumerate(lines):
    if '{/* Context Menu */}' in line:
        lines.insert(i, contact_modal_tsx)
        break

with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)
print("Patched contact modal")
