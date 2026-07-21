import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { ringtonePlayer } from '../utils/audio';

interface GroupCallModalProps {
  chatId: string;
  chatName: string;
  isVideo: boolean;
  socket: Socket;
  onClose: () => void;
  isIncoming?: boolean;
  initiatorId?: string;
  myId: string;
}

export function GroupCallModal({ chatId, chatName, isVideo, socket, onClose, isIncoming, initiatorId, myId }: GroupCallModalProps) {
  const [status, setStatus] = useState(isIncoming ? 'Incoming Group Call...' : 'Starting Group Call...');
  const [callAccepted, setCallAccepted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(isVideo);
  const [busyParticipants, setBusyParticipants] = useState<string[]>([]);
  const [rejectedParticipants, setRejectedParticipants] = useState<string[]>([]);
  
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingIceCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    ringtonePlayer.startRinging(isIncoming);
    
    if (!isIncoming) {
      startCall();
    }

    const handleGroupPeerJoined = async (data: { userId: string }) => {
      console.log("Peer joined group call:", data.userId);
      if (data.userId === myId) return;
      
      const pc = createPeer(data.userId, true);
      peersRef.current[data.userId] = pc;
    };

    const handleGroupOffer = async (data: { fromUserId: string, offer: any }) => {
      console.log("Received group offer from:", data.fromUserId);
      const pc = createPeer(data.fromUserId, false);
      peersRef.current[data.fromUserId] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const queued = pendingIceCandidates.current[data.fromUserId] || [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Error adding queued ICE candidate", err, candidate);
        }
      }
      delete pendingIceCandidates.current[data.fromUserId];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("group_call_answer", { toUserId: data.fromUserId, answer, chatId });
    };

    const handleGroupAnswer = async (data: { fromUserId: string, answer: any }) => {
      console.log("Received group answer from:", data.fromUserId);
      const pc = peersRef.current[data.fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const handleGroupIceCandidate = async (data: { fromUserId: string, candidate: any }) => {
      const pc = peersRef.current[data.fromUserId];
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch(e) {
          console.warn("Error adding ice candidate", e);
          pendingIceCandidates.current[data.fromUserId] = [
            ...(pendingIceCandidates.current[data.fromUserId] || []),
            data.candidate
          ];
        }
      } else {
        pendingIceCandidates.current[data.fromUserId] = [
          ...(pendingIceCandidates.current[data.fromUserId] || []),
          data.candidate
        ];
      }
    };

    const handleGroupPeerLeft = (data: { userId: string }) => {
      if (peersRef.current[data.userId]) {
        peersRef.current[data.userId].close();
        delete peersRef.current[data.userId];
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[data.userId];
          return newStreams;
        });
      }
    };

    const handleGroupCallBusy = (data: { fromUserId: string, chatId: string }) => {
      setBusyParticipants(prev => Array.from(new Set([...prev, data.fromUserId])));
      setStatus('Some participants are busy');
    };

    const handleGroupCallRejected = (data: { fromUserId: string, chatId: string, reason: string }) => {
      setRejectedParticipants(prev => Array.from(new Set([...prev, data.fromUserId])));
      setStatus('Some participants declined the call');
    };

    socket.on('group_peer_joined', handleGroupPeerJoined);
    socket.on('group_call_offer', handleGroupOffer);
    socket.on('group_call_answer', handleGroupAnswer);
    socket.on('group_ice_candidate', handleGroupIceCandidate);
    socket.on('group_peer_left', handleGroupPeerLeft);
    socket.on('group_call_busy', handleGroupCallBusy);
    socket.on('group_call_rejected', handleGroupCallRejected);

    return () => {
      cleanupCall();
      socket.off('group_peer_joined', handleGroupPeerJoined);
      socket.off('group_call_offer', handleGroupOffer);
      socket.off('group_call_answer', handleGroupAnswer);
      socket.off('group_ice_candidate', handleGroupIceCandidate);
      socket.off('group_peer_left', handleGroupPeerLeft);
      socket.off('group_call_busy', handleGroupCallBusy);
      socket.off('group_call_rejected', handleGroupCallRejected);
    };
  }, []);

  const createPeer = (userId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("group_ice_candidate", { toUserId: userId, candidate: event.candidate, chatId });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Group remote track received for', userId);
      if (event.streams[0]) {
        setRemoteStreams(prev => ({
          ...prev,
          [userId]: event.streams[0]
        }));
      }
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer).then(() => {
          socket.emit("group_call_offer", { toUserId: userId, offer, chatId });
        });
      });
    }

    return pc;
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {
          console.warn('[WebRTC] Local group preview autoplay blocked');
        });
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices", err);
      return null;
    }
  };

  const startCall = async () => {
    const stream = await getMedia();
    if (!stream) {
      setStatus("Media access failed");
      setTimeout(handleEndCall, 2000);
      return;
    }
    
    setCallAccepted(true);
    setStatus(isIncoming ? 'Connecting...' : 'Waiting for members to join...');
    startDuration();
    socket.emit("join_group_call", { chatId, isVideo });
  };

  const cleanupCall = () => {
    ringtonePlayer.stop();
    if (durationInterval.current) clearInterval(durationInterval.current);
    
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleEndCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    cleanupCall();
    socket.emit("leave_group_call", { chatId });
    onClose();
  };

  const rejectCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    cleanupCall();
    if (initiatorId) {
      socket.emit('group_call_rejected', { toUserId: initiatorId, chatId, reason: 'declined' });
    }
    onClose();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => (track.enabled = !micOn));
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => (track.enabled = !videoOn));
        setVideoOn(!videoOn);
      }
    }
  };

  const startDuration = () => {
    setStatus('00:00');
    let m = 0, s = 0;
    durationInterval.current = setInterval(() => {
      s++;
      if (s > 59) { s = 0; m++; }
      setStatus(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
  };

  const acceptCall = async () => {
    if (endedRef.current) return;
    ringtonePlayer.stop();
    await startCall();
  };

  const participants = Object.values(remoteStreams);
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 flex flex-col font-sans">
      <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex flex-col items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center space-x-1.5 text-gray-400 text-xs font-medium mb-4 bg-gray-900/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Lock size={12} />
            <span>End-to-end encrypted group call</span>
          </div>
          <h2 className="text-2xl font-medium mb-1 drop-shadow-md">{chatName}</h2>
          <p className="text-gray-300 drop-shadow-md text-sm flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2"><Users size={14}/> {participants.length + 1} participant(s)</span>
            <span className="inline-flex items-center gap-2 text-sm text-[#AEBAC1]">{status}</span>
          </p>
          {(busyParticipants.length > 0 || rejectedParticipants.length > 0) && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-[#E9EDEF]">
              {busyParticipants.length > 0 && (
                <span className="bg-[#FBBF24]/15 text-[#FBBF24] px-3 py-1 rounded-full">{busyParticipants.length} busy</span>
              )}
              {rejectedParticipants.length > 0 && (
                <span className="bg-[#F87171]/15 text-[#F87171] px-3 py-1 rounded-full">{rejectedParticipants.length} declined</span>
              )}
            </div>
          )}
        </div>

        {callAccepted ? (
          <div className={`mt-20 w-full h-full grid gap-4 p-4 ${participants.length > 0 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <div className="relative rounded-2xl overflow-hidden bg-gray-800 shadow-xl border border-gray-700/50 flex flex-col">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${!videoOn ? 'hidden' : ''}`}
              />
              {!videoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400">You</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                You {micOn ? '' : '(Muted)'}
              </div>
            </div>
            
            {Object.entries(remoteStreams).map(([uid, stream]) => (
              <div key={uid} className="relative rounded-2xl overflow-hidden bg-gray-800 shadow-xl border border-gray-700/50">
                <VideoPlayer stream={stream} />
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                  User {uid.substring(0,4)}
                </div>
              </div>
            ))}
            {remoteStreams && Object.keys(remoteStreams).length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-[#AEBAC1]" />
                </div>
                <p className="text-sm text-[#E9EDEF] mb-2">Waiting for participants to join...</p>
                <p className="text-xs text-[#8696A0]">Everyone will appear here once they accept the call.</p>
              </div>
            )}
          </div>
        ) : (
           <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-800 shadow-2xl"
             >
               <Users className="w-16 h-16 text-gray-500" />
             </motion.div>
           </div>
        )}
      </div>

      <div className="p-8 pb-12 flex justify-center items-center space-x-6 z-30 bg-gradient-to-t from-black/80 to-transparent">
        {isIncoming && !callAccepted ? (
          <>
            <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <Video className="w-6 h-6 text-white" />
            </button>
            <button onClick={rejectCall} className="w-14 h-14 rounded-full bg-[#EA4335] hover:bg-[#d33c30] flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-4 bg-gray-900/60 px-6 py-4 rounded-full backdrop-blur-md">
            <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-gray-800/80 hover:bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            {isVideo && (
              <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${videoOn ? 'bg-gray-800/80 hover:bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}
            <button onClick={handleEndCall} className="w-14 h-14 rounded-full bg-[#EA4335] hover:bg-[#d33c30] flex items-center justify-center shadow-lg ml-2 transition-transform hover:scale-105">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {
        console.warn('[WebRTC] Remote group video autoplay blocked');
      });
    }
  }, [stream]);
  return (
    <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
  );
}
