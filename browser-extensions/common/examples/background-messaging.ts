/**
 * Background Messaging Example
 *
 * Demonstrates message passing between different parts of a Chrome extension:
 * - Simple message passing
 * - Long-lived connections (ports)
 * - Cross-extension messaging
 */

// ============================================================================
// Example 1: Simple One-Time Messages
// ============================================================================

/**
 * Message types for type safety
 */
interface MessageTypes {
  GET_DATA: { type: 'GET_DATA'; key: string };
  SET_DATA: { type: 'SET_DATA'; key: string; value: unknown };
  EXECUTE_ACTION: { type: 'EXECUTE_ACTION'; action: string };
  UPDATE_UI: { type: 'UPDATE_UI'; data: unknown };
}

type Message = MessageTypes[keyof MessageTypes];

/**
 * Send message from content script to background
 */
async function sendToBackground<T = unknown>(message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response as T);
      }
    });
  });
}

/**
 * Send message to specific tab
 */
async function sendToTab<T = unknown>(tabId: number, message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response as T);
      }
    });
  });
}

/**
 * Broadcast message to all tabs
 */
async function broadcastToAllTabs(message: Message): Promise<void> {
  const tabs = await chrome.tabs.query({});

  const promises = tabs.map((tab) => {
    if (tab.id) {
      return sendToTab(tab.id, message).catch(() => {
        // Tab might not have content script
      });
    }
  });

  await Promise.all(promises);
}

/**
 * Broadcast to active tabs only
 */
async function broadcastToActiveTabs(message: Message): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true });

  const promises = tabs.map((tab) => {
    if (tab.id) {
      return sendToTab(tab.id, message).catch(() => {});
    }
  });

  await Promise.all(promises);
}

// ============================================================================
// Example 2: Message Listener in Background Script
// ============================================================================

/**
 * Response types
 */
interface ResponseTypes {
  success: { success: true; data?: unknown };
  error: { success: false; error: string };
}

type Response = ResponseTypes[keyof ResponseTypes];

/**
 * Setup message listener in background script
 */
function setupBackgroundListener(): void {
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    // Handle async responses
    handleMessage(message, sender).then(sendResponse);

    // Return true to indicate async response
    return true;
  });
}

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<Response> {
  console.log('Received message:', message, 'from:', sender);

  try {
    switch (message.type) {
      case 'GET_DATA':
        const data = await getData(message.key);
        return { success: true, data };

      case 'SET_DATA':
        await setData(message.key, message.value);
        return { success: true };

      case 'EXECUTE_ACTION':
        await executeAction(message.action);
        return { success: true };

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Example data operations
 */
async function getData(key: string): Promise<unknown> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

async function setData(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function executeAction(action: string): Promise<void> {
  console.log('Executing action:', action);
  // Implement action logic
}

// ============================================================================
// Example 3: Long-Lived Connections (Ports)
// ============================================================================

/**
 * Port connection manager
 */
class PortConnection {
  private port: chrome.runtime.Port | null = null;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  private onDisconnect?: () => void;

  /**
   * Connect to background script
   */
  connect(name: string = 'content-port'): void {
    this.port = chrome.runtime.connect({ name });

    this.port.onMessage.addListener((message) => {
      this.handleMessage(message);
    });

    this.port.onDisconnect.addListener(() => {
      console.log('Port disconnected');
      this.port = null;
      if (this.onDisconnect) {
        this.onDisconnect();
      }
    });

    console.log('Port connected:', name);
  }

  /**
   * Send message through port
   */
  send(type: string, data?: unknown): void {
    if (!this.port) {
      console.error('Port not connected');
      return;
    }

    this.port.postMessage({ type, data });
  }

  /**
   * Register message handler
   */
  on(type: string, handler: (data: unknown) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Unregister message handler
   */
  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Set disconnect handler
   */
  setDisconnectHandler(handler: () => void): void {
    this.onDisconnect = handler;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: { type: string; data?: unknown }): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    } else {
      console.warn('No handler for message type:', message.type);
    }
  }

  /**
   * Disconnect port
   */
  disconnect(): void {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.port !== null;
  }
}

// ============================================================================
// Example 4: Background Port Listener
// ============================================================================

/**
 * Port manager for background script
 */
class BackgroundPortManager {
  private ports: Map<string, chrome.runtime.Port> = new Map();
  private messageHandlers: Map<string, (data: unknown, port: chrome.runtime.Port) => void> = new Map();

  constructor() {
    this.setupListener();
  }

  /**
   * Setup port connection listener
   */
  private setupListener(): void {
    chrome.runtime.onConnect.addListener((port) => {
      console.log('New port connection:', port.name);

      this.ports.set(port.name, port);

      port.onMessage.addListener((message) => {
        this.handleMessage(message, port);
      });

      port.onDisconnect.addListener(() => {
        console.log('Port disconnected:', port.name);
        this.ports.delete(port.name);
      });
    });
  }

  /**
   * Register message handler
   */
  on(type: string, handler: (data: unknown, port: chrome.runtime.Port) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: { type: string; data?: unknown }, port: chrome.runtime.Port): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data, port);
    }
  }

  /**
   * Send message to specific port
   */
  sendToPort(portName: string, type: string, data?: unknown): void {
    const port = this.ports.get(portName);
    if (port) {
      port.postMessage({ type, data });
    } else {
      console.error('Port not found:', portName);
    }
  }

  /**
   * Broadcast to all ports
   */
  broadcast(type: string, data?: unknown): void {
    this.ports.forEach((port) => {
      port.postMessage({ type, data });
    });
  }

  /**
   * Get all connected ports
   */
  getPorts(): Map<string, chrome.runtime.Port> {
    return this.ports;
  }

  /**
   * Check if port is connected
   */
  hasPort(portName: string): boolean {
    return this.ports.has(portName);
  }
}

// ============================================================================
// Example 5: Tab-to-Tab Communication
// ============================================================================

/**
 * Tab communication helper
 */
class TabCommunicator {
  private tabId: number;

  constructor(tabId: number) {
    this.tabId = tabId;
  }

  /**
   * Send message to this tab
   */
  async send<T = unknown>(message: Message): Promise<T> {
    return sendToTab<T>(this.tabId, message);
  }

  /**
   * Get tab info
   */
  async getInfo(): Promise<chrome.tabs.Tab> {
    return await chrome.tabs.get(this.tabId);
  }

  /**
   * Execute script in tab
   */
  async executeScript<T = unknown>(func: () => T): Promise<T> {
    const results = await chrome.scripting.executeScript({
      target: { tabId: this.tabId },
      func
    });

    return results[0].result as T;
  }

  /**
   * Inject CSS into tab
   */
  async injectCSS(css: string): Promise<void> {
    await chrome.scripting.insertCSS({
      target: { tabId: this.tabId },
      css
    });
  }
}

/**
 * Get communicator for active tab
 */
async function getActiveTabCommunicator(): Promise<TabCommunicator | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    return new TabCommunicator(tab.id);
  }
  return null;
}

// ============================================================================
// Example 6: Cross-Extension Messaging
// ============================================================================

/**
 * Send message to another extension
 */
async function sendToExtension<T = unknown>(
  extensionId: string,
  message: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(extensionId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response as T);
      }
    });
  });
}

/**
 * Listen for external messages
 */
function setupExternalMessageListener(): void {
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('External message from:', sender.id, message);

    // Only accept messages from trusted extensions
    const trustedExtensions = ['extension-id-1', 'extension-id-2'];

    if (sender.id && trustedExtensions.includes(sender.id)) {
      handleExternalMessage(message).then(sendResponse);
      return true;
    } else {
      sendResponse({ error: 'Untrusted extension' });
    }
  });
}

/**
 * Handle external messages
 */
async function handleExternalMessage(message: unknown): Promise<unknown> {
  // Handle message from another extension
  console.log('Processing external message:', message);
  return { success: true };
}

// ============================================================================
// Example 7: Message Queue System
// ============================================================================

/**
 * Message queue for reliable delivery
 */
class MessageQueue {
  private queue: Array<{ message: Message; retries: number }> = [];
  private processing: boolean = false;
  private maxRetries: number = 3;

  /**
   * Add message to queue
   */
  enqueue(message: Message): void {
    this.queue.push({ message, retries: 0 });
    this.process();
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await sendToBackground(item.message);
        // Success, remove from queue
        this.queue.shift();
      } catch (error) {
        console.error('Message delivery failed:', error);

        item.retries++;

        if (item.retries >= this.maxRetries) {
          console.error('Max retries reached, discarding message:', item.message);
          this.queue.shift();
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * item.retries));
        }
      }
    }

    this.processing = false;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

// ============================================================================
// Example 8: Request-Response Pattern
// ============================================================================

/**
 * Request-response handler
 */
class RequestHandler {
  private pendingRequests: Map<string, (response: unknown) => void> = new Map();
  private requestId: number = 0;

  constructor() {
    this.setupListener();
  }

  /**
   * Setup response listener
   */
  private setupListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.responseId) {
        const handler = this.pendingRequests.get(message.responseId);
        if (handler) {
          handler(message.data);
          this.pendingRequests.delete(message.responseId);
        }
      }
    });
  }

  /**
   * Send request and wait for response
   */
  async request<T = unknown>(type: string, data?: unknown): Promise<T> {
    const requestId = `req_${this.requestId++}`;

    return new Promise((resolve) => {
      this.pendingRequests.set(requestId, resolve as (response: unknown) => void);

      chrome.runtime.sendMessage({
        type,
        data,
        requestId
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve(null as T);
        }
      }, 30000);
    });
  }
}

// ============================================================================
// Example 9: Usage Examples
// ============================================================================

// Content script example
async function contentScriptExample(): Promise<void> {
  // Send simple message
  const response = await sendToBackground<{ success: boolean }>({
    type: 'GET_DATA',
    key: 'user_settings'
  });

  console.log('Response:', response);

  // Use port connection
  const port = new PortConnection();
  port.connect('my-connection');

  port.on('UPDATE', (data) => {
    console.log('Received update:', data);
  });

  port.send('READY');

  // Use message queue
  const queue = new MessageQueue();
  queue.enqueue({ type: 'SET_DATA', key: 'test', value: 'hello' });
}

// Background script example
function backgroundScriptExample(): void {
  // Setup message listener
  setupBackgroundListener();

  // Setup port manager
  const portManager = new BackgroundPortManager();

  portManager.on('READY', (data, port) => {
    console.log('Client ready:', port.name);
    port.postMessage({ type: 'UPDATE', data: 'Welcome!' });
  });

  // Broadcast to all connected ports
  setInterval(() => {
    portManager.broadcast('HEARTBEAT', { timestamp: Date.now() });
  }, 5000);
}

// Tab communication example
async function tabCommunicationExample(): Promise<void> {
  const communicator = await getActiveTabCommunicator();

  if (communicator) {
    // Send message
    await communicator.send({ type: 'UPDATE_UI', data: { theme: 'dark' } });

    // Execute script
    const title = await communicator.executeScript(() => document.title);
    console.log('Page title:', title);

    // Inject CSS
    await communicator.injectCSS('body { background-color: red; }');
  }
}

export {
  sendToBackground,
  sendToTab,
  broadcastToAllTabs,
  broadcastToActiveTabs,
  setupBackgroundListener,
  PortConnection,
  BackgroundPortManager,
  TabCommunicator,
  getActiveTabCommunicator,
  sendToExtension,
  setupExternalMessageListener,
  MessageQueue,
  RequestHandler,
  Message,
  MessageTypes,
  Response
};
