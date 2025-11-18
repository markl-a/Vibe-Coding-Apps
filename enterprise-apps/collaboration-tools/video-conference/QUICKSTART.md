# Video Conference - 快速開始指南

## 📦 前置要求

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **Git**
- **TURN/STUN 服務器** (可選，用於 NAT 穿透)

## 🚀 快速啟動（Docker）

```bash
# 1. 進入專案目錄
cd video-conference

# 2. 啟動所有服務
docker-compose up -d

# 3. 查看服務狀態
docker-compose ps
```

服務啟動後：
- 🌐 **前端**: http://localhost:3000
- 🔧 **後端 API**: http://localhost:3002
- 🗄️ **PostgreSQL**: localhost:5432
- 💾 **Redis**: localhost:6379

## 🎥 測試視訊會議功能

### 1. 創建會議

```bash
curl -X POST http://localhost:3002/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "團隊週會",
    "scheduledStart": "2025-01-20T14:00:00Z",
    "scheduledEnd": "2025-01-20T15:00:00Z",
    "settings": {
      "requirePassword": false,
      "allowRecording": true,
      "muteOnEntry": false,
      "waitingRoom": false,
      "allowScreenShare": true,
      "maxParticipants": 50
    }
  }'
```

### 2. 加入會議（WebSocket）

在前端應用中使用 Socket.IO 客戶端：

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// 加入會議
socket.emit('join-meeting', {
  meetingId: 'meeting-id',
  user: {
    id: 'user-id',
    username: 'John Doe'
  },
  role: 'PARTICIPANT'
});

// 接收參與者列表
socket.on('participants-list', (participants) => {
  console.log('Current participants:', participants);
});

// 接收新用戶加入通知
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
});
```

### 3. 控制音視訊

```javascript
// 切換視訊
socket.emit('toggle-video', {
  meetingId: 'meeting-id',
  isVideoOn: true
});

// 切換音訊
socket.emit('toggle-audio', {
  meetingId: 'meeting-id',
  isAudioOn: true
});

// 分享屏幕
socket.emit('share-screen', {
  meetingId: 'meeting-id',
  isSharing: true
});

// 舉手
socket.emit('raise-hand', {
  meetingId: 'meeting-id',
  isRaised: true
});
```

### 4. WebRTC 信令

```javascript
// 發送 Offer
socket.emit('webrtc-offer', {
  to: 'target-user-id',
  offer: peerConnection.localDescription
});

// 接收 Offer
socket.on('webrtc-offer', async ({ from, offer }) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('webrtc-answer', {
    to: from,
    answer: answer
  });
});

// 處理 ICE Candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('webrtc-ice-candidate', {
      to: 'target-user-id',
      candidate: event.candidate
    });
  }
};

socket.on('webrtc-ice-candidate', ({ candidate }) => {
  peerConnection.addIceCandidate(candidate);
});
```

## 🤖 AI 功能測試

### 1. 語音轉文字（轉錄）

```bash
curl -X POST http://localhost:3002/api/meetings/ai/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@meeting-recording.webm"
```

### 2. 生成會議摘要

```bash
curl -X POST http://localhost:3002/api/meetings/ai/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "transcripts": [
      {
        "speaker": "John",
        "text": "我們今天討論新功能的開發計劃",
        "timestamp": 1000
      },
      {
        "speaker": "Jane",
        "text": "我建議使用 React 來實現前端",
        "timestamp": 5000
      },
      {
        "speaker": "John",
        "text": "好的，那 Jane 負責前端，我負責後端",
        "timestamp": 10000
      }
    ],
    "meetingInfo": {
      "title": "產品開發會議",
      "participants": ["John", "Jane"],
      "duration": 1800000
    }
  }'
```

### 3. 即時字幕生成

```bash
curl -X POST http://localhost:3002/api/meetings/ai/captions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audioChunk=@audio-chunk.webm"
```

### 4. 會議對話分析

```bash
curl -X POST http://localhost:3002/api/meetings/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "transcripts": [
      {"speaker": "John", "text": "我們來討論這個問題", "timestamp": 1000},
      {"speaker": "Jane", "text": "我有一些想法", "timestamp": 2000},
      {"speaker": "John", "text": "很好，請分享", "timestamp": 3000}
    ]
  }'
```

響應示例：
```json
{
  "success": true,
  "data": {
    "engagement": 85,
    "speakingTime": {
      "John": 120,
      "Jane": 90
    },
    "topicDrift": false,
    "suggestions": [
      "發言時間分配較為均衡"
    ]
  }
}
```

### 5. 情感分析

```bash
curl -X POST http://localhost:3002/api/meetings/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "transcript": "這次會議非常有成效！大家都提出了很好的想法，我很期待看到最終成果。"
  }'
```

### 6. 智能建議

```bash
curl -X POST http://localhost:3002/api/meetings/ai/suggestions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentTopic": "產品開發計劃",
    "recentTranscripts": [
      {"speaker": "John", "text": "...", "timestamp": 1000}
    ],
    "timeElapsed": 2700000,
    "scheduledDuration": 3600000
  }'
```

## 🎬 完整流程示例

### 前端 React 組件示例

```typescript
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const VideoConference: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    // 初始化 Socket.IO
    const newSocket = io('http://localhost:3002', {
      auth: { token: localStorage.getItem('token') }
    });
    setSocket(newSocket);

    // 獲取本地媒體流
    initLocalStream();

    return () => {
      newSocket.disconnect();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const joinMeeting = (meetingId: string) => {
    if (socket) {
      socket.emit('join-meeting', {
        meetingId,
        user: { id: 'user-123', username: 'John Doe' },
        role: 'PARTICIPANT'
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
      socket?.emit('toggle-video', { meetingId: 'meeting-id', isVideoOn: !isVideoOn });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioOn;
      setIsAudioOn(!isAudioOn);
      socket?.emit('toggle-audio', { meetingId: 'meeting-id', isAudioOn: !isAudioOn });
    }
  };

  return (
    <div className="video-conference">
      <div className="video-grid">
        <video ref={localVideoRef} autoPlay muted className="local-video" />
        {/* 遠程視訊流 */}
      </div>

      <div className="controls">
        <button onClick={toggleVideo}>
          {isVideoOn ? '關閉視訊' : '開啟視訊'}
        </button>
        <button onClick={toggleAudio}>
          {isAudioOn ? '靜音' : '取消靜音'}
        </button>
      </div>
    </div>
  );
};
```

## 🔧 配置 TURN/STUN 服務器

為了在不同網絡環境下建立 WebRTC 連接，需要配置 TURN/STUN 服務器：

```javascript
const iceServers = [
  // Google 公共 STUN 服務器
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },

  // 自建 TURN 服務器（需要認證）
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'username',
    credential: 'password'
  }
];

const peerConnection = new RTCPeerConnection({ iceServers });
```

### 使用 Coturn 搭建 TURN 服務器

```bash
# 使用 Docker 運行 Coturn
docker run -d --network=host \
  -v $(pwd)/turnserver.conf:/etc/coturn/turnserver.conf \
  coturn/coturn
```

## 📊 監控和分析

### 查看會議統計

```bash
curl http://localhost:3002/api/meetings/:id/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 查看錄製文件

```bash
curl http://localhost:3002/api/meetings/:id/recordings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 常見問題

### Q: 視訊無法顯示？

確保瀏覽器有相機權限，並檢查 HTTPS 連接（WebRTC 要求）。

### Q: 無法建立 P2P 連接？

檢查 TURN/STUN 服務器配置，確保網絡防火牆允許 UDP 流量。

### Q: 音訊有回聲？

確保本地視訊設置為 muted，使用耳機可以避免回聲。

### Q: 延遲過高？

- 檢查網絡帶寬
- 降低視訊分辨率
- 使用就近的 TURN 服務器

## 📚 更多資源

- [WebRTC 官方文檔](https://webrtc.org/)
- [Socket.IO 文檔](https://socket.io/docs/)
- [MediaSoup SFU](https://mediasoup.org/)
- [Coturn TURN 服務器](https://github.com/coturn/coturn)

---

**🎉 現在你可以開始使用視訊會議系統了！**
