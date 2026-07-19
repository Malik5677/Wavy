import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Activity, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminView({ token, currentUserId, savedContacts = [] }: { token: string, currentUserId?: string, savedContacts?: any[] }) {
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalMessages: 0, activeUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsers(data.users.filter((u: any) => u.id !== currentUserId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if(!confirm("Are you sure you want to ban this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        toast.success("User banned");
        fetchAdminData();
      }
    } catch(err) { toast.error("Failed to ban user"); }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111B21] overflow-hidden">
      <header className="h-[64px] bg-[#202C33] flex items-center px-6 shrink-0 shadow-sm z-10 border-b border-[#222E35]">
        <div className="flex items-center text-[#E9EDEF]">
          <h1 className="text-[19px] font-semibold tracking-tight">System Analytics</h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#202C33] p-4 rounded-xl shadow-sm border border-[#2A3942] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#60A5FA]" />
              <div className="text-sm text-[#8696A0]">Users</div>
            </div>
            <div className="text-2xl font-semibold text-[#E9EDEF]">{users.length}</div>
          </div>
          
          <div className="bg-[#202C33] p-4 rounded-xl shadow-sm border border-[#2A3942] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#00A884]" />
              <div className="text-sm text-[#8696A0]">Online</div>
            </div>
            <div className="text-2xl font-semibold text-[#E9EDEF]">{users.filter(u => u.isOnline).length}</div>
          </div>
          
          <div className="bg-[#202C33] p-4 rounded-xl shadow-sm border border-[#2A3942] flex flex-col justify-center col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-[#A78BFA]" />
              <div className="text-sm text-[#8696A0]">Total Messages</div>
            </div>
            <div className="text-2xl font-semibold text-[#E9EDEF]">{stats.totalMessages}</div>
          </div>
        </div>

        <div>
          <h2 className="text-[16px] font-semibold text-[#E9EDEF] mb-3 px-1">User Management</h2>
          <div className="bg-[#202C33] rounded-xl shadow-sm border border-[#2A3942] overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-[#8696A0]">Loading users...</div>
            ) : (
              <div className="flex flex-col">
                {users.map(u => {
                  const saved = savedContacts.find(c => c.contactId === u.id);
                  const mainName = saved ? saved.customName : (u.phoneNumber || u.displayName || 'Unknown');
                  return (
                  <div key={u.id} className="flex items-center justify-between p-3 border-b border-[#2A3942] last:border-0 hover:bg-[#2A3942] transition-colors">
                    <div className="flex flex-col min-w-0">
                      <div className="font-medium text-[#E9EDEF] truncate text-sm">{mainName}</div>
                      {saved && u.phoneNumber && <div className="text-xs text-[#8696A0] truncate">{u.phoneNumber}</div>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {u.isOnline ? (
                        <div className="w-2 h-2 rounded-full bg-[#00A884]" title="Online"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#8696A0]" title="Offline"></div>
                      )}
                      <button onClick={() => handleBanUser(u.id)} className="text-[#F87171] hover:text-[#FCA5A5] p-1 rounded-md hover:bg-[#F87171]/10 transition-colors" title="Ban User">
                        <Ban size={16} />
                      </button>
                    </div>
                  </div>
                );})}
                {users.length === 0 && (
                  <div className="p-4 text-center text-sm text-[#8696A0]">No users found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
