with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

old_code = """        <div className="mt-auto mb-4 flex flex-col items-center space-y-4">
          <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Settings">
            <Settings className="w-6 h-6" />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 cursor-pointer transition-colors" title="Toggle Theme">
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 cursor-pointer transition-colors" title="Logout">"""

new_code = """        <div className="mt-auto mb-4 flex flex-col items-center space-y-4">
          <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Settings">
            <Settings className="w-6 h-6" />
          </button>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 cursor-pointer transition-colors" title="Logout">"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('src/pages/Home.tsx', 'w') as f:
        f.write(content)
    print("Removed theme toggle button")
else:
    print("old_code not found")
