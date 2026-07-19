import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

target = """                  statuses.map(s => (
                    <div key={s.id} onClick={() => { setIsStatusOpen(true); setActiveStatusUser({ ...s, userName: s.userId === user?.id ? 'You' : 'Someone', statuses: [s] }); }} className="flex items-center gap-4 p-2 hover:bg-[#202C33] rounded-lg cursor-pointer">
                      <div className="w-12 h-12 rounded-full border-2 border-[#00A884] p-0.5 shrink-0">
                         <div className="w-full h-full rounded-full bg-[#374045] flex items-center justify-center text-white overflow-hidden">
                            {s.type === 'text' ? <span className="text-xs">{s.content.substring(0, 10)}</span> : <img src={s.content} className="w-full h-full object-cover" />}
                         </div>
                      </div>
                      <div>
                        <h3 className="text-[#E9EDEF] font-medium">{s.userId === user?.id ? 'You' : 'Someone'}</h3>
                        <p className="text-sm text-[#8696A0]">{new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))"""

new_code = """                  statuses.map(s => {
                    const lastStatus = s.statuses[s.statuses.length - 1];
                    if (!lastStatus) return null;
                    return (
                    <div key={s.user.id} onClick={() => { setIsStatusOpen(true); setActiveStatusUser({ ...s, userName: s.user.id === user?.id ? 'You' : (s.user.displayName || s.user.username || 'Someone') }); }} className="flex items-center gap-4 p-2 hover:bg-[#202C33] rounded-lg cursor-pointer">
                      <div className="w-12 h-12 rounded-full border-2 border-[#00A884] p-0.5 shrink-0">
                         <div className="w-full h-full rounded-full bg-[#374045] flex items-center justify-center text-white overflow-hidden">
                            {lastStatus.type === 'text' ? <span className="text-xs">{lastStatus.content?.substring(0, 10)}</span> : <img src={lastStatus.content} className="w-full h-full object-cover" />}
                         </div>
                      </div>
                      <div>
                        <h3 className="text-[#E9EDEF] font-medium">{s.user.id === user?.id ? 'You' : (s.user.displayName || s.user.username || 'Someone')}</h3>
                        <p className="text-sm text-[#8696A0]">{new Date(lastStatus.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  )})"""

content = content.replace(target, new_code)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
