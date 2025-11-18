# Realtime Chat GraphQL API - AI Features

## 🤖 AI 增強功能

這個即時聊天 GraphQL API 可以使用共享的 AI 服務來提供智能聊天體驗。

### 可用的 AI 功能

#### 1. 智能回覆建議
```graphql
query {
  suggestReplies(messageId: "id") {
    suggestions
    confidence
  }
}
```

#### 2. 訊息情感分析
```graphql
subscription {
  messageAdded(roomId: "id") {
    id
    content
    sender { name }
    aiSentiment {
      overall
      score
    }
  }
}
```

#### 3. 自動訊息翻譯
```graphql
mutation {
  translateMessage(
    messageId: "id"
    targetLanguage: "zh-TW"
  ) {
    translatedContent
    sourceLanguage
  }
}
```

#### 4. 訊息摘要（長對話）
```graphql
query {
  summarizeConversation(
    roomId: "id"
    fromDate: "2024-01-01"
  ) {
    summary
    keyPoints
    participantHighlights
  }
}
```

#### 5. 智能聊天機器人
```graphql
mutation {
  sendMessageToBot(
    content: "What's the weather?"
    context: { userId: "id" }
  ) {
    response
    confidence
  }
}
```

#### 6. 內容審核
```graphql
mutation {
  sendMessage(roomId: "id", content: "message") {
    id
    content
    moderationStatus  # APPROVED, FLAGGED, BLOCKED
  }
}
```

#### 7. 自動回覆（當用戶離線）
```graphql
mutation {
  setAutoReply(
    enabled: true
    message: "I'm away, will reply soon"
  ) {
    success
  }
}
```

#### 8. 對話主題識別
```graphql
query {
  analyzeTopic(roomId: "id") {
    primaryTopic
    subTopics
    confidence
  }
}
```

#### 9. 訊息意圖識別
```graphql
query {
  message(id: "id") {
    content
    aiIntent {
      type        # QUESTION, STATEMENT, REQUEST, COMMAND
      confidence
      entities    # 識別的實體（人名、地點等）
    }
  }
}
```

#### 10. 語音轉文字（進階）
```graphql
mutation {
  transcribeVoiceMessage(audioUrl: "url") {
    text
    language
    confidence
  }
}
```

## 🚀 如何啟用

### 1. 複製共享工具

```bash
# 從專案根目錄
cp -r blog-graphql-api/src/services/aiService.js realtime-chat-graphql/src/services/
cp -r blog-graphql-api/src/utils/customScalars.js realtime-chat-graphql/src/utils/
```

### 2. 配置環境變數

```env
# AI Service
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your-key-here
AI_MODEL=gpt-3.5-turbo

# Chat Features
ENABLE_AUTO_TRANSLATION=true
ENABLE_MESSAGE_MODERATION=true
ENABLE_SMART_REPLIES=true
```

### 3. 在 Schema 中添加

```graphql
type Message {
  id: ID!
  content: String!
  sender: User!
  room: Room!
  createdAt: DateTime!

  # AI 功能
  aiSentiment: SentimentAnalysis
  aiIntent: MessageIntent
  aiSuggestedReplies: [String!]
  aiTranslation(language: String!): String
}

type MessageIntent {
  type: IntentType!
  confidence: Float!
  entities: [Entity!]!
}

enum IntentType {
  QUESTION
  STATEMENT
  REQUEST
  COMMAND
  GREETING
  FAREWELL
}

type Entity {
  type: String!
  value: String!
  confidence: Float!
}
```

### 4. 實現智能回覆

```javascript
const aiService = require('./services/aiService');

const resolvers = {
  Query: {
    // 生成回覆建議
    suggestReplies: async (parent, { messageId }, context) => {
      const message = await Message.findById(messageId);

      // 獲取對話歷史
      const history = await Message.find({
        room: message.room,
        createdAt: { $lt: message.createdAt },
      })
        .sort({ createdAt: -1 })
        .limit(5);

      // 構建上下文
      const conversationContext = history
        .reverse()
        .map(m => `${m.sender.name}: ${m.content}`)
        .join('\n');

      const prompt = `
        Based on this conversation, suggest 3 appropriate replies:

        ${conversationContext}
        ${message.sender.name}: ${message.content}

        Your reply:
      `;

      const suggestions = await aiService.aiClient.callAI(prompt);

      return {
        suggestions: suggestions.split('\n').filter(s => s.trim()),
        confidence: 0.8,
      };
    },

    // 對話摘要
    summarizeConversation: async (parent, { roomId, fromDate }, context) => {
      const messages = await Message.find({
        room: roomId,
        createdAt: { $gte: new Date(fromDate) },
      }).populate('sender');

      const conversation = messages
        .map(m => `${m.sender.name}: ${m.content}`)
        .join('\n');

      const prompt = `
        Summarize this conversation:

        ${conversation}

        Provide:
        1. Overall summary
        2. Key points discussed
        3. Important highlights by each participant
      `;

      const summary = await aiService.aiClient.callAI(prompt);

      return {
        summary: summary.split('\n')[0],
        keyPoints: summary.split('\n').slice(1, 4),
        participantHighlights: summary.split('\n').slice(4),
      };
    },
  },

  Mutation: {
    // 發送訊息（帶審核）
    sendMessage: async (parent, { roomId, content }, context) => {
      // 內容審核
      let moderationStatus = 'APPROVED';

      if (process.env.ENABLE_MESSAGE_MODERATION === 'true') {
        const sentiment = await aiService.analyzeSentiment(content);

        if (sentiment.score < -0.7) {
          moderationStatus = 'FLAGGED';
        }

        // 檢查是否包含不當內容
        if (content.toLowerCase().includes('spam')) {
          moderationStatus = 'BLOCKED';
          throw new GraphQLError('Message blocked by moderation');
        }
      }

      // 創建訊息
      const message = await Message.create({
        content,
        sender: context.userId,
        room: roomId,
        moderationStatus,
      });

      // 發布訂閱事件
      pubsub.publish('MESSAGE_ADDED', { messageAdded: message });

      return message;
    },

    // 訊息翻譯
    translateMessage: async (parent, { messageId, targetLanguage }, context) => {
      const message = await Message.findById(messageId);

      const translatedContent = await aiService.translate(
        message.content,
        targetLanguage
      );

      return {
        translatedContent,
        sourceLanguage: 'auto-detected',
      };
    },

    // 聊天機器人
    sendMessageToBot: async (parent, { content, context: userContext }, ctx) => {
      const prompt = `
        You are a helpful assistant in a chat application.
        User: ${content}

        Provide a helpful, concise response.
      `;

      const response = await aiService.aiClient.callAI(prompt);

      // 儲存機器人訊息
      await Message.create({
        content: response,
        sender: 'BOT_USER_ID',
        room: userContext.roomId,
      });

      return {
        response,
        confidence: 0.9,
      };
    },
  },

  Message: {
    // 情感分析
    aiSentiment: async (parent) => {
      return await aiService.analyzeSentiment(parent.content);
    },

    // 意圖識別
    aiIntent: async (parent) => {
      const prompt = `
        Analyze the intent of this message:
        "${parent.content}"

        Classify as: QUESTION, STATEMENT, REQUEST, COMMAND, GREETING, or FAREWELL
        Extract any entities (names, places, etc.)
      `;

      const result = await aiService.aiClient.callAI(prompt);

      return {
        type: 'STATEMENT', // 從 result 解析
        confidence: 0.85,
        entities: [],
      };
    },

    // 智能回覆建議
    aiSuggestedReplies: async (parent) => {
      const suggestions = await generateQuickReplies(parent.content);
      return suggestions;
    },

    // 即時翻譯
    aiTranslation: async (parent, { language }) => {
      return await aiService.translate(parent.content, language);
    },
  },
};
```

## 📝 實用功能實現

### 智能快速回覆

```javascript
async function generateQuickReplies(messageContent) {
  // 分析訊息類型
  const isQuestion = messageContent.includes('?');
  const isGreeting = /^(hi|hello|hey)/i.test(messageContent);

  if (isGreeting) {
    return ['Hello!', 'Hi there!', 'Hey! How are you?'];
  }

  if (isQuestion) {
    return [
      'Yes, that sounds good',
      'Let me check on that',
      'No, I don\'t think so',
    ];
  }

  // 通用回覆
  return [
    'Got it!',
    'Thanks for letting me know',
    'Sounds good',
  ];
}
```

### 對話主題追蹤

```javascript
async function trackConversationTopics(roomId) {
  // 獲取最近的訊息
  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(50);

  const conversation = messages
    .reverse()
    .map(m => m.content)
    .join(' ');

  // 使用 AI 識別主題
  const topics = await aiService.generateTags(conversation, 3);

  return {
    primaryTopic: topics[0],
    subTopics: topics.slice(1),
    confidence: 0.8,
  };
}
```

### 自動回覆機器人

```javascript
async function handleAutoReply(message, user) {
  // 檢查用戶是否啟用自動回覆
  if (!user.autoReplyEnabled) return;

  // 檢查用戶是否在線
  const isOnline = await checkUserOnlineStatus(user.id);
  if (isOnline) return;

  // 發送自動回覆
  const autoReplyMessage = user.autoReplyMessage ||
    'I\'m currently away. Will get back to you soon!';

  await Message.create({
    content: autoReplyMessage,
    sender: user.id,
    room: message.room,
    isAutoReply: true,
  });
}
```

### 訊息優先級排序

```javascript
async function prioritizeMessages(userId) {
  const messages = await Message.find({
    recipient: userId,
    read: false,
  });

  // 使用 AI 分析每個訊息的重要性
  const scoredMessages = await Promise.all(
    messages.map(async (message) => {
      const sentiment = await aiService.analyzeSentiment(message.content);

      let priority = 0;

      // 問題優先
      if (message.content.includes('?')) priority += 20;

      // 緊急關鍵字
      if (/urgent|important|asap/i.test(message.content)) priority += 30;

      // 情感強度
      priority += Math.abs(sentiment.score) * 20;

      // 發送者關係（可以從用戶互動歷史計算）
      const senderImportance = await calculateSenderImportance(
        userId,
        message.sender
      );
      priority += senderImportance * 10;

      return { message, priority };
    })
  );

  return scoredMessages
    .sort((a, b) => b.priority - a.priority)
    .map(item => item.message);
}
```

## 🔮 進階功能

### 語音助手整合

```javascript
async function handleVoiceCommand(audioUrl, userId) {
  // 1. 語音轉文字
  const transcript = await speechToText(audioUrl);

  // 2. 意圖識別
  const intent = await identifyIntent(transcript);

  // 3. 執行對應動作
  switch (intent.type) {
    case 'SEND_MESSAGE':
      await sendMessage(intent.recipient, intent.message);
      break;
    case 'READ_MESSAGES':
      return await getUnreadMessages(userId);
    case 'SEARCH':
      return await searchMessages(userId, intent.query);
  }
}
```

### 智能通知

```javascript
async function shouldNotifyUser(message, user) {
  // 使用 AI 判斷是否應該通知用戶

  // 1. 用戶當前是否忙碌
  const userStatus = await getUserStatus(user.id);
  if (userStatus === 'DO_NOT_DISTURB') return false;

  // 2. 訊息重要性
  const priority = await calculateMessagePriority(message);
  if (priority < 50) return false; // 低優先級訊息不通知

  // 3. 是否在工作時間
  const now = new Date();
  if (now.getHours() < 9 || now.getHours() > 18) {
    // 非工作時間只通知高優先級
    return priority > 80;
  }

  return true;
}
```

---

**讓 AI 打造更智能的即時通訊體驗！** 🚀
