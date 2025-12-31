/**
 * Real-time Chat Example
 *
 * Demonstrates WebSocket-based real-time messaging with presence,
 * typing indicators, read receipts, and message history.
 */

import { EventEmitter } from 'events';

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  metadata?: Record<string, any>;
  deliveredTo: string[];
  readBy: string[];
}

// User presence
export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  customStatus?: string;
}

// Typing indicator
export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  startedAt: Date;
}

// Chat connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * Real-time Chat Client
 *
 * WebSocket-based chat client with automatic reconnection,
 * message queuing, and presence tracking
 */
export class RealtimeChatClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private userId: string;
  private userName: string;
  private serverUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageQueue: Message[] = [];
  private conversations: Map<string, Message[]> = new Map();
  private presenceMap: Map<string, UserPresence> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private typingTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string, userId: string, userName: string) {
    super();
    this.serverUrl = serverUrl;
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Connect to chat server
   */
  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionState = 'connecting';
    this.emit('connection-state-change', this.connectionState);

    try {
      this.socket = new WebSocket(this.serverUrl);

      this.socket.onopen = () => {
        console.log('Connected to chat server');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.emit('connection-state-change', this.connectionState);
        this.emit('connected');

        // Authenticate
        this.authenticate();

        // Start heartbeat
        this.startHeartbeat();

        // Send queued messages
        this.flushMessageQueue();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.socket.onclose = () => {
        console.log('Disconnected from chat server');
        this.connectionState = 'disconnected';
        this.emit('connection-state-change', this.connectionState);
        this.emit('disconnected');

        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      this.emit('error', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from chat server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.stopHeartbeat();
    this.connectionState = 'disconnected';
    this.emit('connection-state-change', this.connectionState);
  }

  /**
   * Authenticate with server
   */
  private authenticate(): void {
    this.send({
      type: 'auth',
      userId: this.userId,
      userName: this.userName,
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    this.emit('connection-state-change', this.connectionState);

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send data to server
   */
  private send(data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'message':
          this.handleChatMessage(message.data);
          break;
        case 'message-delivered':
          this.handleMessageDelivered(message.data);
          break;
        case 'message-read':
          this.handleMessageRead(message.data);
          break;
        case 'typing-start':
          this.handleTypingStart(message.data);
          break;
        case 'typing-stop':
          this.handleTypingStop(message.data);
          break;
        case 'presence-update':
          this.handlePresenceUpdate(message.data);
          break;
        case 'history':
          this.handleHistory(message.data);
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(message: Message): void {
    // Add to conversation
    let conversation = this.conversations.get(message.conversationId);
    if (!conversation) {
      conversation = [];
      this.conversations.set(message.conversationId, conversation);
    }
    conversation.push(message);

    this.emit('message', message);

    // Send delivery receipt
    if (message.senderId !== this.userId) {
      this.sendDeliveryReceipt(message.id, message.conversationId);
    }
  }

  /**
   * Handle message delivered notification
   */
  private handleMessageDelivered(data: { messageId: string; userId: string }): void {
    // Update message delivered status
    for (const conversation of this.conversations.values()) {
      const message = conversation.find((m) => m.id === data.messageId);
      if (message && !message.deliveredTo.includes(data.userId)) {
        message.deliveredTo.push(data.userId);
        this.emit('message-delivered', message);
      }
    }
  }

  /**
   * Handle message read notification
   */
  private handleMessageRead(data: { messageId: string; userId: string }): void {
    // Update message read status
    for (const conversation of this.conversations.values()) {
      const message = conversation.find((m) => m.id === data.messageId);
      if (message && !message.readBy.includes(data.userId)) {
        message.readBy.push(data.userId);
        this.emit('message-read', message);
      }
    }
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(data: TypingIndicator): void {
    this.typingIndicators.set(data.userId, data);
    this.emit('typing-start', data);

    // Auto-clear typing indicator after 5 seconds
    setTimeout(() => {
      if (this.typingIndicators.has(data.userId)) {
        this.handleTypingStop({ userId: data.userId, conversationId: data.conversationId });
      }
    }, 5000);
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(data: { userId: string; conversationId: string }): void {
    this.typingIndicators.delete(data.userId);
    this.emit('typing-stop', data);
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(presence: UserPresence): void {
    this.presenceMap.set(presence.userId, presence);
    this.emit('presence-update', presence);
  }

  /**
   * Handle message history
   */
  private handleHistory(data: { conversationId: string; messages: Message[] }): void {
    this.conversations.set(data.conversationId, data.messages);
    this.emit('history', data);
  }

  /**
   * Send a message
   */
  sendMessage(conversationId: string, content: string, options: {
    type?: Message['type'];
    replyTo?: string;
    metadata?: Record<string, any>;
  } = {}): Message {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: this.userId,
      senderName: this.userName,
      content,
      type: options.type ?? 'text',
      timestamp: new Date(),
      replyTo: options.replyTo,
      metadata: options.metadata,
      deliveredTo: [],
      readBy: [this.userId],
    };

    if (this.connectionState === 'connected') {
      this.send({
        type: 'message',
        data: message,
      });

      // Add to local conversation
      let conversation = this.conversations.get(conversationId);
      if (!conversation) {
        conversation = [];
        this.conversations.set(conversationId, conversation);
      }
      conversation.push(message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }

    this.emit('message-sent', message);
    return message;
  }

  /**
   * Send delivery receipt
   */
  private sendDeliveryReceipt(messageId: string, conversationId: string): void {
    this.send({
      type: 'message-delivered',
      data: {
        messageId,
        conversationId,
        userId: this.userId,
      },
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: string, conversationId: string): void {
    this.send({
      type: 'message-read',
      data: {
        messageId,
        conversationId,
        userId: this.userId,
      },
    });
  }

  /**
   * Mark conversation as read
   */
  markConversationAsRead(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.forEach((message) => {
      if (message.senderId !== this.userId && !message.readBy.includes(this.userId)) {
        this.sendReadReceipt(message.id, conversationId);
      }
    });
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): void {
    this.send({
      type: 'typing-start',
      data: {
        userId: this.userId,
        userName: this.userName,
        conversationId,
        startedAt: new Date(),
      },
    });

    // Auto-stop typing after 3 seconds of inactivity
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.send({
      type: 'typing-stop',
      data: {
        userId: this.userId,
        conversationId,
      },
    });
  }

  /**
   * Update presence
   */
  updatePresence(status: UserPresence['status'], customStatus?: string): void {
    this.send({
      type: 'presence-update',
      data: {
        userId: this.userId,
        userName: this.userName,
        status,
        customStatus,
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Request message history
   */
  requestHistory(conversationId: string, limit: number = 50, before?: Date): void {
    this.send({
      type: 'request-history',
      data: {
        conversationId,
        limit,
        before,
      },
    });
  }

  /**
   * Edit message
   */
  editMessage(messageId: string, conversationId: string, newContent: string): void {
    this.send({
      type: 'edit-message',
      data: {
        messageId,
        conversationId,
        content: newContent,
      },
    });
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string, conversationId: string): void {
    this.send({
      type: 'delete-message',
      data: {
        messageId,
        conversationId,
      },
    });
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send({
          type: 'message',
          data: message,
        });
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get conversation messages
   */
  getConversationMessages(conversationId: string): Message[] {
    return this.conversations.get(conversationId) ?? [];
  }

  /**
   * Get typing users
   */
  getTypingUsers(conversationId: string): TypingIndicator[] {
    return Array.from(this.typingIndicators.values()).filter(
      (t) => t.conversationId === conversationId && t.userId !== this.userId
    );
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): UserPresence | undefined {
    return this.presenceMap.get(userId);
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Basic chat setup
 */
export async function exampleBasicChat() {
  const chat = new RealtimeChatClient(
    'ws://localhost:3000/chat',
    'user-123',
    'John Doe'
  );

  // Set up event listeners
  chat.on('connected', () => {
    console.log('Connected to chat server');
  });

  chat.on('message', (message: Message) => {
    console.log(`${message.senderName}: ${message.content}`);

    // Display message in UI
    displayMessage(message);

    // Mark as read if conversation is open
    if (isConversationOpen(message.conversationId)) {
      chat.sendReadReceipt(message.id, message.conversationId);
    }
  });

  chat.on('typing-start', (indicator: TypingIndicator) => {
    console.log(`${indicator.userName} is typing...`);
    showTypingIndicator(indicator);
  });

  chat.on('typing-stop', ({ userId }) => {
    hideTypingIndicator(userId);
  });

  chat.on('presence-update', (presence: UserPresence) => {
    console.log(`${presence.userName} is ${presence.status}`);
    updateUserStatus(presence);
  });

  // Connect to server
  await chat.connect();

  return chat;
}

/**
 * Example: Send messages
 */
export function exampleSendMessages(chat: RealtimeChatClient) {
  const conversationId = 'conv-123';

  // Simple text message
  chat.sendMessage(conversationId, 'Hello, how are you?');

  // Reply to a message
  chat.sendMessage(conversationId, 'Great, thanks!', {
    replyTo: 'msg-456',
  });

  // Send with metadata
  chat.sendMessage(conversationId, 'Check this out!', {
    metadata: {
      attachments: ['file-123'],
      priority: 'high',
    },
  });
}

/**
 * Example: Typing indicators
 */
export function exampleTypingIndicators(chat: RealtimeChatClient) {
  const conversationId = 'conv-123';
  const inputElement = document.getElementById('message-input') as HTMLInputElement;

  if (inputElement) {
    let isTyping = false;

    inputElement.addEventListener('input', () => {
      if (inputElement.value.length > 0 && !isTyping) {
        chat.startTyping(conversationId);
        isTyping = true;
      } else if (inputElement.value.length === 0 && isTyping) {
        chat.stopTyping(conversationId);
        isTyping = false;
      }
    });

    inputElement.addEventListener('blur', () => {
      if (isTyping) {
        chat.stopTyping(conversationId);
        isTyping = false;
      }
    });
  }
}

/**
 * Example: Load message history
 */
export async function exampleLoadHistory(chat: RealtimeChatClient) {
  const conversationId = 'conv-123';

  chat.on('history', ({ conversationId, messages }) => {
    console.log(`Loaded ${messages.length} messages for ${conversationId}`);
    messages.forEach(displayMessage);
  });

  // Load last 50 messages
  chat.requestHistory(conversationId, 50);

  // Load older messages
  const oldestMessage = chat.getConversationMessages(conversationId)[0];
  if (oldestMessage) {
    chat.requestHistory(conversationId, 50, oldestMessage.timestamp);
  }
}

/**
 * Example: Presence management
 */
export function examplePresenceManagement(chat: RealtimeChatClient) {
  // Update presence based on activity
  let activityTimeout: NodeJS.Timeout;

  const resetActivityTimeout = () => {
    clearTimeout(activityTimeout);

    // Set to online
    chat.updatePresence('online');

    // Auto-away after 5 minutes
    activityTimeout = setTimeout(() => {
      chat.updatePresence('away', 'Away from keyboard');
    }, 5 * 60 * 1000);
  };

  // Track user activity
  document.addEventListener('mousemove', resetActivityTimeout);
  document.addEventListener('keypress', resetActivityTimeout);

  // Set offline on page unload
  window.addEventListener('beforeunload', () => {
    chat.updatePresence('offline');
  });

  // Initial presence
  resetActivityTimeout();
}

/**
 * Example: Read receipts
 */
export function exampleReadReceipts(chat: RealtimeChatClient) {
  chat.on('message-delivered', (message: Message) => {
    console.log(`Message delivered to ${message.deliveredTo.length} users`);
    updateMessageStatus(message.id, 'delivered');
  });

  chat.on('message-read', (message: Message) => {
    console.log(`Message read by ${message.readBy.length} users`);
    updateMessageStatus(message.id, 'read');
  });

  // Mark conversation as read when opened
  const conversationId = 'conv-123';
  chat.markConversationAsRead(conversationId);
}

/**
 * Example: Edit and delete messages
 */
export function exampleEditDelete(chat: RealtimeChatClient) {
  const conversationId = 'conv-123';
  const messageId = 'msg-123';

  // Edit message
  chat.editMessage(messageId, conversationId, 'Updated message content');

  // Delete message
  chat.deleteMessage(messageId, conversationId);
}

// Helper functions (to be implemented in actual UI)
function displayMessage(message: Message): void {
  console.log('Display message:', message);
}

function isConversationOpen(conversationId: string): boolean {
  return true; // Implement based on UI state
}

function showTypingIndicator(indicator: TypingIndicator): void {
  console.log('Show typing indicator:', indicator);
}

function hideTypingIndicator(userId: string): void {
  console.log('Hide typing indicator:', userId);
}

function updateUserStatus(presence: UserPresence): void {
  console.log('Update user status:', presence);
}

function updateMessageStatus(messageId: string, status: string): void {
  console.log('Update message status:', messageId, status);
}
