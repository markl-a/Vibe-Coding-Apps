# WebRTC Video Chat

A simple peer-to-peer video conferencing application using WebRTC and Socket.IO.

## Features

- **Peer-to-Peer Video Calls**: Direct video/audio streaming between participants
- **Room-Based**: Create or join rooms with unique IDs
- **Media Controls**: Mute/unmute audio and enable/disable video
- **Real-Time Signaling**: Socket.IO-based signaling server
- **Responsive UI**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, Socket.IO
- **WebRTC**: Native browser APIs with STUN servers

## Architecture

```
┌─────────────┐                         ┌─────────────┐
│   Client A  │◀───── WebRTC P2P ─────▶│   Client B  │
│   (React)   │        Media Stream     │   (React)   │
└──────┬──────┘                         └──────┬──────┘
       │                                        │
       │         Socket.IO Signaling            │
       │                                        │
       ▼                                        ▼
┌─────────────────────────────────────────────────────┐
│                  Signaling Server                    │
│                    (Express)                         │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Modern browser with WebRTC support

### Installation

```bash
pnpm install
```

### Development

```bash
# Start both server and client
pnpm dev

# Or separately:
pnpm dev:server  # Signaling server on port 3001
pnpm dev:client  # React app on port 3000
```

### Production Build

```bash
pnpm build
node dist/server/index.js
```

## Usage

1. Open the app in your browser
2. Enter your name
3. Create a new room or enter an existing room ID
4. Share the room ID with others
5. Start your video call!

## How It Works

### Signaling Flow

1. **Join Room**: User connects to Socket.IO and joins a room
2. **User Joined Event**: Existing users receive notification
3. **Create Offer**: Existing user creates WebRTC offer
4. **Exchange SDP**: Offer and answer are exchanged via signaling server
5. **ICE Candidates**: Network candidates are exchanged
6. **Media Streaming**: Direct P2P connection established

### Key Components

- **`server/index.ts`**: Socket.IO signaling server
- **`src/components/VideoRoom.tsx`**: WebRTC logic and video display
- **`src/components/JoinRoom.tsx`**: Room entry form

## WebRTC Configuration

Uses free Google STUN servers for NAT traversal:

```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
```

For production, consider adding TURN servers for better connectivity.

## Extending

### Add Screen Sharing

```typescript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
});
```

### Add Recording

Use the MediaRecorder API to record streams.

### Multi-Party Calls

For more than 2 participants, consider:
- **Mesh topology**: Each peer connects to all others
- **SFU (Selective Forwarding Unit)**: Use LiveKit or Jitsi

## Resources

- [WebRTC API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)
- [LiveKit](https://livekit.io/) - Open-source WebRTC SFU
- [PeerJS](https://peerjs.com/) - WebRTC wrapper library

## License

MIT
