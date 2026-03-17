import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(socket, session, roomId, players) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }

  const createPeerConnection = useCallback((targetSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice_candidate', { to: targetSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: event.streams[0]
      }));
    };

    return pc;
  }, [socket]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      return null;
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      // Notify others we left
      socket.emit('webrtc:leave_call', { roomId, sessionId: session.id });
      // Cleanup all peers
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setRemoteStreams({});
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Handle incoming offer
    socket.on('webrtc:offer', async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      peersRef.current[from] = pc;
      
      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc:answer', { to: from, answer });
    });

    // Handle incoming answer
    socket.on('webrtc:answer', async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Handle incoming ICE candidate
    socket.on('webrtc:ice_candidate', async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Handle peer left
    socket.on('webrtc:peer_left', ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    // When someone else joins the room, if we have video active, send them an offer
    socket.on('room:player_joined', async ({ player }) => {
       if (localStream && player.socketId !== socket.id) {
          const pc = createPeerConnection(player.socketId);
          peersRef.current[player.socketId] = pc;
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { to: player.socketId, offer, sessionId: session.id });
       }
    });

    return () => {
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice_candidate');
      socket.off('webrtc:peer_left');
      socket.off('room:player_joined');
    };
  }, [socket, localStream, session.id, createPeerConnection]);

  // Special function to initiate connections with all existing players when we join video
  const initiateCall = async (stream) => {
    for (const player of players) {
      if (player.socketId && player.socketId !== socket.id && player.isOnline) {
        const pc = createPeerConnection(player.socketId);
        peersRef.current[player.socketId] = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { to: player.socketId, offer, sessionId: session.id });
      }
    }
  };

  return { localStream, remoteStreams, startLocalStream, stopLocalStream, initiateCall };
}
