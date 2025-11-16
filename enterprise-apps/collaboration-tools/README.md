# 協作工具 (Collaboration Tools)
🤖 **AI-Driven | AI-Native** 🚀

協作工具幫助團隊高效溝通、共享知識、協同工作。使用 AI 輔助開發可以快速建立現代化、智能化的企業協作平台。

## 📋 目錄

- [協作工具概述](#協作工具概述)
- [核心功能模組](#核心功能模組)
- [技術架構](#技術架構)
- [實時通訊](#實時通訊)
- [AI 智能功能](#ai-智能功能)

---

## 🎯 協作工具概述

### 核心功能領域

- **即時通訊**：聊天、頻道、直接訊息、群組
- **視訊會議**：視訊通話、屏幕共享、錄製
- **文檔協作**：共同編輯、版本控制、評論
- **知識管理**：Wiki、知識庫、FAQ
- **任務管理**：待辦清單、任務分配、追蹤
- **日曆與會議**：會議安排、日程管理、提醒
- **文件共享**：雲端存儲、權限管理、搜索

---

## 🧩 核心功能模組

### 1. 即時通訊

```typescript
// 訊息結構
interface Message {
  id: string;
  channelId: string;
  userId: string;
  user: User;

  // 內容
  content: string;
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'LINK' | 'CODE' | 'SYSTEM';

  // 附件
  attachments: Attachment[];

  // 反應
  reactions: Reaction[];

  // 線程
  threadId?: string;
  replyCount: number;
  replies?: Message[];

  // 提及
  mentions: Mention[];

  // 狀態
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;

  // 時間
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

// 頻道
interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;

  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT' | 'GROUP';

  // 成員
  members: ChannelMember[];
  memberCount: number;

  // 權限
  isArchived: boolean;
  isReadOnly: boolean;

  // 設置
  settings: {
    notifications: 'ALL' | 'MENTIONS' | 'NONE';
    allowThreads: boolean;
    allowReactions: boolean;
    retentionDays?: number;
  };

  createdBy: string;
  createdAt: Date;
}

// 訊息服務實現
@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private websocketGateway: WebSocketGateway,
    private notificationService: NotificationService,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<Message> {
    const message = new Message();
    message.channelId = dto.channelId;
    message.userId = dto.userId;
    message.content = dto.content;
    message.type = dto.type || 'TEXT';

    // 處理提及
    message.mentions = this.extractMentions(dto.content);

    // 處理附件
    if (dto.attachments) {
      message.attachments = await this.uploadAttachments(dto.attachments);
    }

    await this.messageRepository.save(message);

    // 實時推送
    await this.websocketGateway.broadcastToChannel(dto.channelId, {
      event: 'message.new',
      data: message,
    });

    // 發送通知給被提及的用戶
    for (const mention of message.mentions) {
      await this.notificationService.sendMentionNotification(
        mention.userId,
        message,
      );
    }

    return message;
  }

  async editMessage(
    messageId: string,
    newContent: string,
    userId: string,
  ): Promise<Message> {
    const message = await this.findOne(messageId);

    if (message.userId !== userId) {
      throw new ForbiddenException('無權編輯此訊息');
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();

    await this.messageRepository.save(message);

    // 實時更新
    await this.websocketGateway.broadcastToChannel(message.channelId, {
      event: 'message.edited',
      data: message,
    });

    return message;
  }

  async addReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const message = await this.findOne(messageId);

    // 檢查是否已經反應過
    const existing = message.reactions.find(
      r => r.emoji === emoji && r.userId === userId,
    );

    if (!existing) {
      message.reactions.push({
        emoji,
        userId,
        createdAt: new Date(),
      });

      await this.messageRepository.save(message);

      // 實時更新
      await this.websocketGateway.broadcastToChannel(message.channelId, {
        event: 'message.reaction.added',
        data: { messageId, emoji, userId },
      });
    }
  }
}
```

### 2. 視訊會議

```typescript
// WebRTC 視訊會議
interface Meeting {
  id: string;
  title: string;
  description?: string;

  // 主持人
  hostId: string;
  host: User;

  // 參與者
  participants: Participant[];
  maxParticipants: number;

  // 時間
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // 狀態
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';

  // 會議室設置
  settings: {
    requirePassword: boolean;
    password?: string;
    allowRecording: boolean;
    muteOnEntry: boolean;
    waitingRoom: boolean;
    allowScreenShare: boolean;
  };

  // 錄製
  recordings: Recording[];

  // 會議連結
  joinUrl: string;
}

interface Participant {
  userId: string;
  user: User;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';

  // 狀態
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;

  joinedAt: Date;
  leftAt?: Date;
}

// WebRTC 信令服務
@WebSocketGateway()
export class VideoCallGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-meeting')
  async handleJoinMeeting(
    @MessageBody() data: { meetingId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { meetingId, userId } = data;

    // 加入房間
    client.join(meetingId);

    // 通知其他參與者
    client.to(meetingId).emit('user-joined', {
      userId,
      timestamp: new Date(),
    });

    // 返回當前參與者列表
    const participants = await this.getParticipants(meetingId);
    client.emit('participants-list', participants);
  }

  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    // 轉發 offer 給目標用戶
    client.to(data.to).emit('webrtc-offer', {
      from: client.id,
      offer: data.offer,
    });
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    // 轉發 answer
    client.to(data.to).emit('webrtc-answer', {
      from: client.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { to: string; candidate: RTCIceCandidate },
    @ConnectedSocket() client: Socket,
  ) {
    // 轉發 ICE candidate
    client.to(data.to).emit('webrtc-ice-candidate', {
      from: client.id,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @MessageBody() data: { meetingId: string; isVideoOn: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    // 廣播視訊狀態變化
    client.to(data.meetingId).emit('participant-video-changed', {
      userId: client.id,
      isVideoOn: data.isVideoOn,
    });
  }
}
```

### 3. 文檔協作

```typescript
// 實時協作文檔
interface Document {
  id: string;
  title: string;
  content: string; // Rich text / Markdown

  // 協作
  collaborators: Collaborator[];
  activeEditors: ActiveEditor[];

  // 版本
  version: number;
  history: DocumentVersion[];

  // 評論
  comments: Comment[];

  // 權限
  owner: string;
  visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
  permissions: Permission[];

  createdAt: Date;
  updatedAt: Date;
}

interface ActiveEditor {
  userId: string;
  user: User;
  cursor: {
    position: number;
    selection?: { start: number; end: number };
  };
  color: string; // 用戶游標顏色
  lastActivity: Date;
}

// 使用 CRDT 或 OT 實現協作編輯
@WebSocketGateway()
export class CollaborativeEditingGateway {
  @SubscribeMessage('document:join')
  async handleJoinDocument(
    @MessageBody() data: { documentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId } = data;

    // 加入文檔房間
    client.join(`doc:${documentId}`);

    // 獲取當前文檔內容
    const document = await this.documentService.findOne(documentId);

    // 返回文檔內容和活躍編輯者
    client.emit('document:init', {
      content: document.content,
      version: document.version,
      activeEditors: document.activeEditors,
    });

    // 通知其他用戶有新編輯者加入
    client.to(`doc:${documentId}`).emit('editor:joined', {
      userId: client.data.userId,
      user: client.data.user,
      color: this.assignColor(),
    });
  }

  @SubscribeMessage('document:edit')
  async handleEdit(
    @MessageBody() data: {
      documentId: string;
      operations: Operation[];
      version: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { documentId, operations, version } = data;

    try {
      // 應用操作（使用 OT 轉換）
      const result = await this.documentService.applyOperations(
        documentId,
        operations,
        version,
      );

      // 廣播變更給其他編輯者
      client.to(`doc:${documentId}`).emit('document:changed', {
        operations: result.transformedOperations,
        version: result.newVersion,
        userId: client.data.userId,
      });

      // 確認給發送者
      client.emit('document:ack', {
        version: result.newVersion,
      });
    } catch (error) {
      // 版本衝突,請求重新同步
      client.emit('document:sync-required');
    }
  }
}
```

### 4. 知識庫

```typescript
// Wiki / 知識庫
interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;

  // 層級
  parentId?: string;
  children: WikiPage[];
  path: string; // "/產品/功能/用戶管理"

  // 元數據
  tags: string[];
  category: string;
  author: User;

  // 權限
  visibility: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  allowedGroups: string[];

  // 統計
  views: number;
  lastViewedAt: Date;

  // 版本
  version: number;
  revisions: PageRevision[];

  createdAt: Date;
  updatedAt: Date;
}

// 全文搜索
@Injectable()
export class WikiSearchService {
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // 使用 Elasticsearch 進行全文搜索
    const results = await this.elasticsearchService.search({
      index: 'wiki_pages',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'content', 'tags^2'],
            fuzziness: 'AUTO',
          },
        },
        highlight: {
          fields: {
            content: {},
          },
        },
        size: options?.limit || 10,
      },
    });

    return results.hits.hits.map(hit => ({
      page: hit._source,
      score: hit._score,
      highlights: hit.highlight?.content,
    }));
  }
}
```

---

## 🤖 AI 智能功能

### 1. 智能回覆建議

```typescript
// AI 驅動的訊息回覆建議
class SmartReplyService {
  async suggestReplies(message: Message): Promise<string[]> {
    // 使用 GPT 生成回覆建議
    const completion = await openai.createCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一個專業的商務溝通助手,提供簡潔專業的回覆建議。',
        },
        {
          role: 'user',
          content: `對於以下訊息,請提供3個簡短的回覆建議:\n\n${message.content}`,
        },
      ],
    });

    // 解析建議
    const suggestions = this.parseSuggestions(completion.choices[0].message.content);

    return suggestions;
  }
}
```

### 2. 會議摘要生成

```python
# AI 自動生成會議摘要
class MeetingSummaryService:
    def __init__(self):
        self.transcription_model = whisper.load_model("base")
        self.summarization_model = pipeline("summarization")

    def generate_summary(self, meeting_id: str) -> dict:
        """生成會議摘要"""

        # 1. 獲取會議錄音
        audio_file = self.get_meeting_recording(meeting_id)

        # 2. 語音轉文字
        transcript = self.transcription_model.transcribe(audio_file)

        # 3. 提取關鍵點
        summary = self.summarization_model(
            transcript['text'],
            max_length=500,
            min_length=100,
        )

        # 4. 識別行動項
        action_items = self.extract_action_items(transcript['text'])

        # 5. 識別決策
        decisions = self.extract_decisions(transcript['text'])

        return {
            'summary': summary[0]['summary_text'],
            'action_items': action_items,
            'decisions': decisions,
            'transcript': transcript['text'],
            'duration': transcript['duration'],
            'participants': self.identify_speakers(transcript),
        }

    def extract_action_items(self, text: str) -> List[dict]:
        """提取行動項"""
        # 使用 NER 和規則提取行動項
        # 尋找 "需要...", "請...", "將會..." 等模式

        action_items = []
        # ... 實現邏輯
        return action_items
```

### 3. 智能搜索

```typescript
// 語義搜索
class SemanticSearchService {
  async search(query: string, context?: string): Promise<SearchResult[]> {
    // 1. 生成查詢向量
    const queryEmbedding = await this.embeddingService.embed(query);

    // 2. 向量搜索
    const vectorResults = await this.vectorDB.search(queryEmbedding, {
      limit: 20,
      filter: context ? { context } : undefined,
    });

    // 3. 重新排序（使用 cross-encoder）
    const reranked = await this.reranker.rerank(query, vectorResults);

    // 4. 生成答案（RAG）
    const answer = await this.generateAnswer(query, reranked.slice(0, 5));

    return {
      results: reranked,
      aiAnswer: answer,
      sources: reranked.slice(0, 5),
    };
  }
}
```

### 4. 智能通知管理

```typescript
// AI 優化的通知系統
class IntelligentNotificationService {
  async sendNotification(notification: Notification): Promise<void> {
    const user = await this.userService.findOne(notification.userId);

    // 1. 檢查用戶偏好
    const preferences = user.notificationPreferences;

    // 2. 預測最佳發送時間
    const optimalTime = await this.predictOptimalTime(user);

    // 3. 判斷緊急程度
    const urgency = await this.classifyUrgency(notification);

    // 4. 選擇通知渠道
    const channels = this.selectChannels(urgency, preferences);

    // 5. 防止通知疲勞
    const shouldSend = await this.checkNotificationFatigue(user);

    if (shouldSend) {
      // 發送通知
      for (const channel of channels) {
        await this.sendViaChannel(channel, notification);
      }
    } else {
      // 延遲或合併通知
      await this.queueNotification(notification, optimalTime);
    }
  }
}
```

---

## 📚 參考資源

### 開源協作工具
- **Mattermost** - 開源 Slack 替代品
- **Rocket.Chat** - 開源團隊協作平台
- **Jitsi** - 開源視訊會議
- **Nextcloud** - 開源文件協作
- **BookStack** - 開源 Wiki 系統

### 商業工具參考
- **Slack** - 團隊通訊
- **Microsoft Teams** - 企業協作
- **Notion** - 協作文檔和知識庫
- **Confluence** - 企業 Wiki

---

**🚀 開始使用 AI 建立你的協作工具,提升團隊生產力！**
