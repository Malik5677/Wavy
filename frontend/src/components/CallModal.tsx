import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User, PhoneCall, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Socket } from 'socket.io-client';
import { ringtonePlayer } from '../utils/audio';


export function CallModal({ 
  isVideo, 
  contactName, 
  onClose,
  socket,
  isIncoming = false,
  incomingOffer = null,
  targetUserId,
  chatId,
  initialCandidates = []
}: { 
  isVideo: boolean, 
  contactName: string, 
  onClose: () => void,
  socket: Socket,
  isIncoming?: boolean,
  incomingOffer?: any,
  targetUserId: string,
  chatId: string,
  initialCandidates?: any[]
}) {
  const [status, setStatus] = useState(isIncoming ? 'Incoming call' : 'Calling...');
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(isVideo);
  const [callAccepted, setCallAccepted] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>(initialCandidates || []);

  const setupWebRTC = async (answering = false) => {
    console.log(`[WebRTC] setupWebRTC(answering=${answering}), isIncoming=${isIncoming}`);
    console.log();
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? { facingMode: "user" } : false,
          audio: true
        });
      } catch (mediaErr) {
        console.warn("Primary media device request failed, falling back to audio only or showing error", mediaErr);
        if (isVideo) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          setVideoOn(false);
        } else {
          throw mediaErr;
        }
      }
      
      localStreamRef.current = stream;
      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;
      pc.onconnectionstatechange = () => {
  console.log("🟢 Connection State:", pc.connectionState);
};

pc.oniceconnectionstatechange = () => {
  console.log("🟡 ICE State:", pc.iceConnectionState);
};

pc.onicegatheringstatechange = () => {
  console.log("🔵 ICE Gathering:", pc.iceGatheringState);
};

pc.onsignalingstatechange = () => {
  console.log("🟣 Signaling:", pc.signalingState);
};

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

     pc.ontrack = (event) => {
  console.log("🎥 Remote Track Received");
  console.log(event);

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = event.streams[0];
  }
};

      pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("📡 Sending ICE Candidate");

    socket.emit("ice_candidate", {
      toUserId: targetUserId,
      candidate: event.candidate,
    });
  } else {
    console.log("✅ ICE Gathering Finished");
  }
};

      if (!isIncoming) {
        // We are calling
        const offer = await pc.createOffer();
        console.log("📤 OFFER");
        console.log(offer);
        await pc.setLocalDescription(offer);
        console.log();
        console.log(`[WebRTC] Emitting call_offer to ${targetUserId}`);
        socket.emit('call_offer', {
          toUserId: targetUserId,
          offer,
          chatId,
          isVideo,
          name: contactName
        });
      } else if (answering) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        console.log("📥 ANSWER");
        console.log(answer);
        await pc.setLocalDescription(answer);
        
        // process pending candidates
        for (const c of pendingCandidates.current) {
          try {
            if (c) {
              await pc.addIceCandidate(c);
            }
          } catch (err) {
            console.warn("[WebRTC] Error adding pending ICE candidate:", err, c);
          }
        }
        pendingCandidates.current = [];
        
        socket.emit('call_answer', {
          toUserId: targetUserId,
          answer
        });
        startDuration();
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setStatus('Microphone/Camera access required');
      setTimeout(() => { onClose(); }, 2000);
    }
  };

  useEffect(() => {
    ringtonePlayer.startRinging(isIncoming);
    
    if (!isIncoming) {
      setupWebRTC();
      
    }

    const handleCallAnswer = async (data: any) => {
      ringtonePlayer.stop();
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          startDuration();
          setCallAccepted(true);
          
          // process pending candidates
          for (const c of pendingCandidates.current) {
            try {
              if (c) {
                await peerConnectionRef.current.addIceCandidate(c);
              }
            } catch (err) {
              console.warn("[WebRTC] Error adding pending ICE candidate during answer:", err, c);
            }
          }
          pendingCandidates.current = [];
        } catch(e) {
          console.error(e);
        }
      }
    };

    const handleIceCandidate = async (data: any) => {
      if (!data || !data.candidate) return;
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch(e) {
          console.warn("[WebRTC] Ignored ICE candidate addition error:", e, data.candidate);
        }
      } else {
        pendingCandidates.current.push(data.candidate);
      }
    };

    const handleEndCallEvent = () => {
      handleEndCall(false);
    };

    socket.on('call_answer', handleCallAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('end_call', handleEndCallEvent);

    return () => {
      cleanupWebRTC();
      socket.off('call_answer', handleCallAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('end_call', handleEndCallEvent);
    };
  }, []);

  const acceptCall = async () => {
    if (!incomingOffer) return;
    ringtonePlayer.stop();
    setStatus('Connecting...');
    await setupWebRTC(true);
    setCallAccepted(true);
    setStatus('Connected');
  };

  const startDuration = () => {
    setStatus('00:00');
    let m = 0;
    let s = 0;
    durationInterval.current = setInterval(() => {
      s++;
      if (s > 59) {
        s = 0;
        m++;
      }
      setStatus(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
  };

  const cleanupWebRTC = () => {
    ringtonePlayer.stop();
    if (durationInterval.current) clearInterval(durationInterval.current);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const endedRef = useRef(false);
  const handleEndCall = (emit = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    cleanupWebRTC();
    if (emit) {
      socket.emit('end_call', { toUserId: targetUserId });
    }
    onClose();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 flex flex-col font-sans">
      <div className="flex-1 flex flex-col relative">
        <video 
          ref={remoteVideoRef}
          autoPlay 
          playsInline 
          className={`absolute inset-0 w-full h-full object-cover ${(!isVideo || !callAccepted) ? 'hidden' : ''}`}
        />
        
        <video 
          ref={localVideoRef}
          autoPlay 
          playsInline 
          muted
          className={`${(!isVideo || (isIncoming && !callAccepted)) ? 'hidden' : ''} ${callAccepted ? 'absolute bottom-36 right-6 w-28 h-40 bg-gray-800 rounded-xl object-cover shadow-2xl z-20 overflow-hidden' : 'absolute inset-0 w-full h-full object-cover'}`}
        />

        <div className={`absolute top-0 left-0 right-0 p-6 pt-12 flex flex-col items-center z-20 ${callAccepted && isVideo ? 'bg-gradient-to-b from-black/60 to-transparent' : ''}`}>
          <div className="flex items-center space-x-2 text-gray-400 text-xs font-medium mb-4 bg-gray-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Lock size={12} />
            <span>End-to-end encrypted</span>
          </div>
          <h2 className="text-2xl font-semibold mb-1 drop-shadow-md">{contactName}</h2>
          <div className="flex items-center gap-3 text-gray-300 text-sm drop-shadow-md">
            <span>{status}</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40">
              {micOn ? 'Mic On' : 'Mic Muted'}
            </span>
            {isVideo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40">
                {videoOn ? 'Camera On' : 'Camera Off'}
              </span>
            )}
          </div>
        </div>

        {(!isVideo || (isIncoming && !callAccepted)) && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-800 shadow-2xl"
            >
              <User className="w-16 h-16 text-gray-500" />
            </motion.div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center items-center space-x-6 z-30 bg-gradient-to-t from-black/80 to-transparent">
        {isIncoming && !callAccepted ? (
          <>
            <button 
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <PhoneCall className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={() => { setStatus('Call declined'); handleEndCall(true); }}
              className="w-14 h-14 rounded-full bg-[#EA4335] hover:bg-[#d33c30] flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-4 bg-gray-900/60 px-6 py-4 rounded-full backdrop-blur-md">
            <button 
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-[#00A884] text-white shadow-lg' : 'bg-white text-gray-900'}`}
              title={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            
            {isVideo && (
              <button 
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${videoOn ? 'bg-[#00A884] text-white shadow-lg' : 'bg-white text-gray-900'}`}
                title={videoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}
            
            <button 
              onClick={() => { setStatus('Call ended'); handleEndCall(true); }}
              className="w-14 h-14 rounded-full bg-[#EA4335] hover:bg-[#d33c30] flex items-center justify-center shadow-lg ml-2 transition-transform hover:scale-105"
              title="End call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
