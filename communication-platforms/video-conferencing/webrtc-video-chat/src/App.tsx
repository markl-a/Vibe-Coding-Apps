import { useState } from 'react';
import { VideoRoom } from './components/VideoRoom';
import { JoinRoom } from './components/JoinRoom';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  const handleJoinRoom = (room: string, user: string) => {
    setRoomId(room);
    setUserId(user);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setUserId('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {roomId ? (
        <VideoRoom
          roomId={roomId}
          userId={userId}
          onLeave={handleLeaveRoom}
        />
      ) : (
        <JoinRoom onJoin={handleJoinRoom} />
      )}
    </div>
  );
}
