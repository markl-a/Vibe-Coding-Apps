import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface VideoRoomProps {
  roomId: string;
  userId: string;
  onLeave: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function VideoRoom({ roomId, userId, onLeave }: VideoRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const init = async () => {
      // Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to get media devices:', err);
        return;
      }

      // Connect to signaling server
      const serverUrl = import.meta.env.DEV
        ? 'http://localhost:3001'
        : window.location.origin;

      socketRef.current = io(serverUrl);

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('join-room', roomId, userId);
      });

      // Handle new user joining
      socketRef.current.on('user-joined', async (newUserId: string) => {
        setParticipants((prev) => [...prev, newUserId]);
        await createOffer();
      });

      // Handle offer
      socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit) => {
        await handleOffer(offer);
      });

      // Handle answer
      socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
        await peerConnectionRef.current?.setRemoteDescription(answer);
      });

      // Handle ICE candidate
      socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
        await peerConnectionRef.current?.addIceCandidate(candidate);
      });

      // Handle user leaving
      socketRef.current.on('user-left', (leftUserId: string) => {
        setParticipants((prev) => prev.filter((p) => p !== leftUserId));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
    };

    init();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      socketRef.current?.emit('leave-room', roomId, userId);
      socketRef.current?.disconnect();
    };
  }, [roomId, userId]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', roomId, event.candidate);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const createOffer = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('offer', roomId, offer, userId);
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit('answer', roomId, answer, userId);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Room: {roomId}</h1>
          <p className="text-gray-400 text-sm">
            {participants.length + 1} participant(s)
          </p>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
        >
          Leave
        </button>
      </header>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded">
            {userId} (You)
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {participants.length === 0 && (
            <p className="absolute text-gray-400">Waiting for others to join...</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${
            isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${
            isVideoOff ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {isVideoOff ? '📵' : '📹'}
        </button>
      </div>
    </div>
  );
}
