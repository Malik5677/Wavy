import React, { useState, useEffect, useRef } from 'react';

export const CustomAudioPlayer = ({ src, isMe }: { src: string; isMe: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
  }, [src]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 w-[260px] h-[44px] px-2 rounded-full ${isMe ? 'bg-[#F2F2F2]' : 'bg-[#2A3942]'}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={togglePlay} className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition ${isMe ? 'text-[#54656F]' : 'text-[#AEBAC1]'}`}>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      
      <div className={`text-[12px] font-medium min-w-[50px] ${isMe ? 'text-[#54656F]' : 'text-[#AEBAC1]'}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="flex-1 flex flex-col justify-center h-full relative px-2">
        <div className={`absolute top-1/2 left-2 right-2 h-[4px] -translate-y-1/2 rounded-full overflow-hidden ${isMe ? 'bg-[#D1D7DB]' : 'bg-[#111B21]'}`}>
          <div className={`h-full ${isMe ? 'bg-[#54656F]' : 'bg-[#00A884]'}`} style={{ width: `${progress}%` }} />
        </div>
        
        {/* Thumb */}
        <div 
          className={`absolute top-1/2 w-3.5 h-3.5 rounded-full -translate-y-1/2 shadow-sm transform -translate-x-1/2 ${isMe ? 'bg-[#54656F]' : 'bg-[#00A884]'}`}
          style={{ left: `calc(0.5rem + ${progress}% * (100% - 1rem) / 100)` }}
        />
      </div>
    </div>
  );
};
