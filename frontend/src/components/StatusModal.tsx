import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function StatusModal({ userName, statuses, onClose, onReply, onLike, likes, likedIds }: { userName: string, statuses: any[], onClose: () => void, onReply?: (message: string) => void, onLike?: (statusId: string) => void, likes?: Record<string, number>, likedIds?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyMessage, setReplyMessage] = useState('');
  
  useEffect(() => {
    let t: any;
    if (progress < 100) {
      t = setTimeout(() => setProgress(p => p + 1), 50);
    } else {
      if (currentIndex < statuses.length - 1) {
        setCurrentIndex(c => c + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
    return () => clearTimeout(t);
  }, [progress, currentIndex, statuses, onClose]);
  
  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setProgress(0);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex space-x-1 mb-4">
          {statuses.map((s, i) => (
            <div key={i} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {userName.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium">{userName}</h3>
              <p className="text-xs text-gray-300">Just now</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-10">
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-10">
        <ChevronRight className="w-8 h-8" />
      </button>
      
      <div className="w-full max-w-md aspect-[9/16] bg-[#111B21] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative"
            style={statuses[currentIndex].bgColor ? { backgroundColor: statuses[currentIndex].bgColor } : {}}
          >
            {statuses[currentIndex].type === 'text' ? (
              <h2 className="text-3xl text-white font-medium" style={{ fontFamily: statuses[currentIndex].font || 'inherit' }}>
                {statuses[currentIndex].content}
              </h2>
            ) : statuses[currentIndex].type === 'video' ? (
              <video src={statuses[currentIndex].content} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : statuses[currentIndex].type === 'link' ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
                <a href={statuses[currentIndex].content} target="_blank" rel="noreferrer" className="text-xl text-blue-400 underline font-medium break-all px-4 text-center">
                  {statuses[currentIndex].content}
                </a>
              </div>
            ) : (
              <img src={statuses[currentIndex].content} alt="Status" className="w-full h-full object-cover" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/70 to-transparent">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between gap-3 mb-3">
            {(() => {
              const currentStatusId = statuses[currentIndex]?.id;
              const liked = currentStatusId ? likedIds?.includes(currentStatusId) : false;
              return (
                <button
                  type="button"
                  onClick={() => {
                    const statusItem = statuses[currentIndex];
                    if (statusItem && onLike) {
                      onLike(statusItem.id || `${currentIndex}`);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${liked ? 'bg-[#00A884] text-[#071a11]' : 'bg-white/10 text-white hover:bg-white/15'}`}
                >
                  <Heart className="w-4 h-4" />
                  {likes?.[statuses[currentIndex]?.id] ?? 0}
                </button>
              );
            })()}
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('statusReplyInput') as HTMLInputElement | null;
                input?.focus();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
          </div>
          <div className="relative">
            <input 
              id="statusReplyInput"
              type="text" 
              placeholder="Reply to status..." 
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="w-full bg-white/10 text-white border border-white/10 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-[#00A884]"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => {
                if (replyMessage.trim() && onReply) {
                  onReply(replyMessage.trim());
                  setReplyMessage('');
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#00A884] p-2 text-white hover:bg-[#12b886] transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
