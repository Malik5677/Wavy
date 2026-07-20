import React, { useState, useEffect } from 'react';
import { Users, Megaphone, Plus, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/api';

export function CommunityView({ token, onOpenChat }: { token: string, onOpenChat?: (chatId: string) => void }) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, [token]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async () => {
    if (!newCommName.trim()) return toast.error('Name is required');
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/community`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newCommName,
          description: newCommDesc,
          groupNames: ['General Chat', 'Help & Support']
        })
      });
      
      if (res.ok) {
        toast.success('Community created!');
        setShowCreate(false);
        setNewCommName('');
        setNewCommDesc('');
        fetchCommunities();
      } else {
        toast.error('Failed to create community');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating community');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111B21] overflow-y-auto">
      <div className="p-4 bg-[#202C33] border-b border-[#222E35]">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-4 w-full p-3 hover:bg-[#111B21] rounded-xl transition-colors text-left">
          <div className="w-12 h-12 bg-[#374045] rounded-xl flex items-center justify-center text-[#8696A0]">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-semibold text-[#E9EDEF] text-lg">New community</span>
        </button>
      </div>

      <div className="space-y-4 p-4">
        {loading ? (
          <div className="text-center text-[#8696A0] py-8">Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="text-center text-[#8696A0] py-8">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>You haven't joined any communities yet.</p>
          </div>
        ) : communities.map(comm => (
          <div key={comm.id} className="bg-[#202C33] rounded-xl shadow-sm border border-[#222E35] overflow-hidden">
            <div className="p-4 border-b border-[#222E35] flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-[#374045] rounded-xl flex items-center justify-center text-blue-600 dark:text-[#60a5fa] font-bold text-xl uppercase overflow-hidden">
                {comm.avatar ? <img src={comm.avatar} className="w-full h-full object-cover" /> : (comm.name ? comm.name.substring(0,2) : 'C')}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#E9EDEF]">{comm.name}</h3>
                <p className="text-sm text-[#8696A0]">{comm.membersCount || 1} members</p>
              </div>
            </div>
            
            <div className="py-2">
              {comm.groups && comm.groups.length > 0 ? (
                <>
                  {comm.groups.find((g: any) => g.name === 'Announcements') && (
                    <div onClick={() => { if(onOpenChat) { onOpenChat(comm.groups.find((g: any) => g.name === 'Announcements').id); } }} className="px-4 py-3 hover:bg-[#111B21] cursor-pointer flex items-center gap-4 transition-colors">
                      <div className="w-10 h-10 bg-green-100 dark:bg-[#00a884]/20 rounded-lg flex items-center justify-center text-green-600 dark:text-[#00a884]">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#E9EDEF]">Announcements</h4>
                        <p className="text-xs text-[#8696A0] line-clamp-1">Updates from community admins</p>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">10:45 AM</div>
                    </div>
                  )}
                  
                  {comm.groups.filter((g: any) => g.name !== 'Announcements').map((g: any) => (
                    <div key={g.id} onClick={() => { if(onOpenChat) { onOpenChat(g.id); } }} className="px-4 py-3 hover:bg-[#111B21] cursor-pointer flex items-center gap-4 transition-colors">
                      <div className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xl">
                        #
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#E9EDEF]">{g.name}</h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  ))}
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-[#8696A0]">No groups in this community yet.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#202C33] rounded-2xl w-full max-w-md overflow-hidden">
            <header className="p-4 border-b border-[#222E35] flex justify-between items-center bg-[#111B21]">
              <h2 className="font-semibold text-lg">Create Community</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#8696A0] hover:bg-[#374045] p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#E9EDEF] mb-1">Community Name</label>
                <input 
                  type="text" 
                  value={newCommName}
                  onChange={e => setNewCommName(e.target.value)}
                  className="w-full px-4 py-2 border border-[#374045] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. React Developers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#E9EDEF] mb-1">Description (Optional)</label>
                <textarea 
                  value={newCommDesc}
                  onChange={e => setNewCommDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-[#374045] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-24"
                  placeholder="What is this community about?"
                />
              </div>
            </div>
            <footer className="p-4 border-t border-[#222E35] bg-[#111B21] flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[#8696A0] hover:bg-[#374045] rounded-lg font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateCommunity} disabled={creating || !newCommName.trim()} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
