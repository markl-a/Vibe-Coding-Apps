import { useState } from 'react';

interface JoinRoomProps {
  onJoin: (roomId: string, userId: string) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userId.trim()) {
      onJoin(roomId.trim(), userId.trim());
    }
  };

  const generateRoomId = () => {
    setRoomId(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">
          WebRTC Video Chat
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium mb-2">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter room ID"
                required
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition"
          >
            Join Room
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Share the room ID with others to start a video call
        </p>
      </div>
    </div>
  );
}
