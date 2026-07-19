import re

with open('src/components/CallModal.tsx', 'r') as f:
    content = f.read()

# Replace useEffect and acceptCall
old_block = content[content.find('  useEffect(() => {'):content.find('  const startDuration = () => {')]

new_block = '''  const setupWebRTC = async (answering = false) => {
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

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            toUserId: targetUserId,
            candidate: event.candidate
          });
        }
      };

      if (!isIncoming) {
        // We are calling
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
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
        await pc.setLocalDescription(answer);
        
        // process pending candidates
        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
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
      setStatus('Media Device Error');
    }
  };

  useEffect(() => {
    if (!isIncoming) {
      setupWebRTC();
    }

    socket.on('call_answer', async (data) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          startDuration();
          setCallAccepted(true);
          
          // process pending candidates
          for (const c of pendingCandidates.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];
        } catch(e) {
          console.error(e);
        }
      }
    });

    socket.on('ice_candidate', async (data) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch(e) {
          console.error(e);
        }
      } else {
        pendingCandidates.current.push(data.candidate);
      }
    });

    socket.on('end_call', () => {
      handleEndCall(false);
    });

    return () => {
      handleEndCall(false);
      socket.off('call_answer');
      socket.off('ice_candidate');
      socket.off('end_call');
    };
  }, []);

  const acceptCall = async () => {
    if (!incomingOffer) return;
    setCallAccepted(true);
    setStatus('Connecting...');
    await setupWebRTC(true);
  };

'''

content = content.replace(old_block, new_block)

with open('src/components/CallModal.tsx', 'w') as f:
    f.write(content)
