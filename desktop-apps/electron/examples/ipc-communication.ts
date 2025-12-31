/**
 * Electron IPC (Inter-Process Communication) Patterns
 *
 * This example demonstrates various IPC communication patterns between
 * the main process and renderer processes in Electron applications.
 *
 * Key Concepts:
 * - Main to Renderer: Sending messages from main to renderer
 * - Renderer to Main: Invoking main process functions from renderer
 * - Two-way Communication: Request-response patterns
 * - Event Broadcasting: Sending to all windows
 * - Type-safe IPC with TypeScript
 */

import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

// ============== Type Definitions ==============

/**
 * Define IPC channel names as constants for type safety
 */
export const IPC_CHANNELS = {
  // Renderer to Main (invoke)
  GET_USER_DATA: 'get-user-data',
  SAVE_USER_DATA: 'save-user-data',
  READ_FILE: 'read-file',
  WRITE_FILE: 'write-file',
  GET_SYSTEM_INFO: 'get-system-info',
  PERFORM_ASYNC_TASK: 'perform-async-task',

  // Main to Renderer (send)
  UPDATE_NOTIFICATION: 'update-notification',
  PROGRESS_UPDATE: 'progress-update',
  THEME_CHANGED: 'theme-changed',
  DATA_SYNCED: 'data-synced',

  // Two-way channels
  PING: 'ping',
  REQUEST_DATA: 'request-data',
} as const;

/**
 * Type-safe IPC handlers
 */
interface UserData {
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  version: string;
  memory: number;
  cpus: number;
}

interface FileContent {
  path: string;
  content: string;
  encoding: BufferEncoding;
}

// ============== Main to Renderer Communication ==============

/**
 * Send messages from main process to all renderer processes
 */
export class MainToRendererMessenger {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Send message to specific window
   */
  sendToWindow(window: BrowserWindow, channel: string, ...args: unknown[]): void {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, ...args);
    }
  }

  /**
   * Send message to main window
   */
  sendToMain(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  /**
   * Broadcast message to all windows
   */
  broadcast(channel: string, ...args: unknown[]): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, ...args);
      }
    });
  }

  /**
   * Example: Send update notification
   */
  notifyUpdate(version: string, changelog: string): void {
    this.broadcast(IPC_CHANNELS.UPDATE_NOTIFICATION, {
      version,
      changelog,
      downloadUrl: `https://example.com/downloads/${version}`,
    });
  }

  /**
   * Example: Send progress update
   */
  sendProgress(taskId: string, progress: number, status: string): void {
    this.sendToMain(IPC_CHANNELS.PROGRESS_UPDATE, {
      taskId,
      progress,
      status,
      timestamp: Date.now(),
    });
  }

  /**
   * Example: Notify theme change
   */
  notifyThemeChange(theme: 'light' | 'dark'): void {
    this.broadcast(IPC_CHANNELS.THEME_CHANGED, { theme });
  }

  /**
   * Example: Notify data sync completion
   */
  notifyDataSynced(items: number, errors: number): void {
    this.broadcast(IPC_CHANNELS.DATA_SYNCED, {
      items,
      errors,
      timestamp: Date.now(),
    });
  }
}

// ============== Renderer to Main Communication ==============

/**
 * Handle IPC requests from renderer processes
 */
export class RendererToMainHandler {
  /**
   * Setup all IPC handlers
   */
  setupHandlers(): void {
    // Simple handlers
    this.setupSimpleHandlers();

    // Async handlers
    this.setupAsyncHandlers();

    // Error handling examples
    this.setupErrorHandlers();
  }

  /**
   * Setup simple synchronous handlers
   */
  private setupSimpleHandlers(): void {
    // Ping-pong example
    ipcMain.handle(IPC_CHANNELS.PING, async () => {
      return 'pong';
    });

    // Get system info
    ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_INFO, async (): Promise<SystemInfo> => {
      const os = require('os');
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        memory: os.totalmem(),
        cpus: os.cpus().length,
      };
    });
  }

  /**
   * Setup asynchronous handlers with complex logic
   */
  private setupAsyncHandlers(): void {
    // Get user data
    ipcMain.handle(
      IPC_CHANNELS.GET_USER_DATA,
      async (event: IpcMainInvokeEvent): Promise<UserData | null> => {
        try {
          const userDataPath = app.getPath('userData');
          const dataPath = path.join(userDataPath, 'user-data.json');

          const data = await fs.readFile(dataPath, 'utf-8');
          return JSON.parse(data) as UserData;
        } catch (error) {
          console.error('Failed to load user data:', error);
          return null;
        }
      }
    );

    // Save user data
    ipcMain.handle(
      IPC_CHANNELS.SAVE_USER_DATA,
      async (event: IpcMainInvokeEvent, userData: UserData): Promise<boolean> => {
        try {
          const userDataPath = app.getPath('userData');
          const dataPath = path.join(userDataPath, 'user-data.json');

          await fs.writeFile(dataPath, JSON.stringify(userData, null, 2), 'utf-8');

          // Notify other windows about the change
          const messenger = new MainToRendererMessenger();
          messenger.broadcast('user-data-updated', userData);

          return true;
        } catch (error) {
          console.error('Failed to save user data:', error);
          return false;
        }
      }
    );

    // Read file with progress
    ipcMain.handle(
      IPC_CHANNELS.READ_FILE,
      async (event: IpcMainInvokeEvent, filePath: string): Promise<FileContent | null> => {
        try {
          // Validate file path (security)
          const normalizedPath = path.normalize(filePath);
          if (normalizedPath.includes('..')) {
            throw new Error('Invalid file path');
          }

          const content = await fs.readFile(normalizedPath, 'utf-8');

          return {
            path: normalizedPath,
            content,
            encoding: 'utf-8',
          };
        } catch (error) {
          console.error('Failed to read file:', error);
          return null;
        }
      }
    );

    // Write file
    ipcMain.handle(
      IPC_CHANNELS.WRITE_FILE,
      async (
        event: IpcMainInvokeEvent,
        filePath: string,
        content: string
      ): Promise<boolean> => {
        try {
          // Validate file path (security)
          const normalizedPath = path.normalize(filePath);
          if (normalizedPath.includes('..')) {
            throw new Error('Invalid file path');
          }

          await fs.writeFile(normalizedPath, content, 'utf-8');
          return true;
        } catch (error) {
          console.error('Failed to write file:', error);
          return false;
        }
      }
    );

    // Perform async task with progress updates
    ipcMain.handle(
      IPC_CHANNELS.PERFORM_ASYNC_TASK,
      async (event: IpcMainInvokeEvent, taskName: string): Promise<string> => {
        const taskId = `task-${Date.now()}`;
        const window = BrowserWindow.fromWebContents(event.sender);

        if (!window) {
          throw new Error('Window not found');
        }

        // Simulate a long-running task with progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Send progress update back to renderer
          window.webContents.send(IPC_CHANNELS.PROGRESS_UPDATE, {
            taskId,
            progress: i,
            status: `Processing ${taskName}... ${i}%`,
          });
        }

        return `Task ${taskName} completed successfully`;
      }
    );
  }

  /**
   * Setup handlers with error handling examples
   */
  private setupErrorHandlers(): void {
    // Example of proper error handling
    ipcMain.handle('risky-operation', async (event: IpcMainInvokeEvent, data: unknown) => {
      try {
        // Validate input
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid input data');
        }

        // Perform operation
        const result = await performRiskyOperation(data);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        // Log error
        console.error('Risky operation failed:', error);

        // Return structured error response
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Remove all handlers (cleanup)
   */
  removeAllHandlers(): void {
    Object.values(IPC_CHANNELS).forEach((channel) => {
      ipcMain.removeHandler(channel);
    });
  }
}

// ============== Two-Way Communication ==============

/**
 * Advanced two-way communication patterns
 */
export class TwoWayIPCHandler {
  private messenger: MainToRendererMessenger;

  constructor(messenger: MainToRendererMessenger) {
    this.messenger = messenger;
  }

  /**
   * Setup request-response pattern
   */
  setupRequestResponse(): void {
    // Handler that requests additional data from renderer
    ipcMain.handle(
      IPC_CHANNELS.REQUEST_DATA,
      async (event: IpcMainInvokeEvent, query: string): Promise<unknown> => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('Window not found');
        }

        // Send request to renderer
        window.webContents.send('data-request', { query, requestId: Date.now() });

        // Wait for response (in real app, use proper promise-based approach)
        return new Promise((resolve) => {
          const handler = (event: Electron.IpcMainEvent, response: unknown) => {
            ipcMain.removeListener('data-response', handler);
            resolve(response);
          };

          ipcMain.on('data-response', handler);

          // Timeout after 5 seconds
          setTimeout(() => {
            ipcMain.removeListener('data-response', handler);
            resolve(null);
          }, 5000);
        });
      }
    );
  }

  /**
   * Setup streaming data pattern
   */
  setupStreaming(): void {
    ipcMain.handle('start-stream', async (event: IpcMainInvokeEvent, streamId: string) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      // Simulate streaming data
      let counter = 0;
      const interval = setInterval(() => {
        if (window.isDestroyed()) {
          clearInterval(interval);
          return;
        }

        window.webContents.send('stream-data', {
          streamId,
          data: { counter: counter++, timestamp: Date.now() },
        });

        if (counter >= 10) {
          clearInterval(interval);
          window.webContents.send('stream-end', { streamId });
        }
      }, 1000);

      return { streamId, status: 'started' };
    });

    ipcMain.handle('stop-stream', async (event: IpcMainInvokeEvent, streamId: string) => {
      // In real app, store interval references and clear them
      return { streamId, status: 'stopped' };
    });
  }
}

// ============== Helper Functions ==============

async function performRiskyOperation(data: unknown): Promise<unknown> {
  // Simulate risky operation
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { processed: true, data };
}

// ============== Preload Script Example ==============

/**
 * This should be in your preload.ts file
 * It exposes safe IPC methods to the renderer process
 */
export const preloadScript = `
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Invoke methods (renderer to main)
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  saveUserData: (data) => ipcRenderer.invoke('save-user-data', data),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  performAsyncTask: (taskName) => ipcRenderer.invoke('perform-async-task', taskName),
  ping: () => ipcRenderer.invoke('ping'),

  // Listen to events (main to renderer)
  onUpdateNotification: (callback) => {
    ipcRenderer.on('update-notification', (event, data) => callback(data));
  },
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, data) => callback(data));
  },
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (event, data) => callback(data));
  },
  onDataSynced: (callback) => {
    ipcRenderer.on('data-synced', (event, data) => callback(data));
  },

  // Remove listeners
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for renderer process
declare global {
  interface Window {
    electronAPI: {
      getUserData: () => Promise<UserData | null>;
      saveUserData: (data: UserData) => Promise<boolean>;
      readFile: (path: string) => Promise<FileContent | null>;
      writeFile: (path: string, content: string) => Promise<boolean>;
      getSystemInfo: () => Promise<SystemInfo>;
      performAsyncTask: (taskName: string) => Promise<string>;
      ping: () => Promise<string>;
      onUpdateNotification: (callback: (data: any) => void) => void;
      onProgressUpdate: (callback: (data: any) => void) => void;
      onThemeChanged: (callback: (data: any) => void) => void;
      onDataSynced: (callback: (data: any) => void) => void;
      removeListener: (channel: string, callback: Function) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
`;

// ============== Renderer Usage Example ==============

/**
 * Example usage in renderer process (React/Vue/etc.)
 */
export const rendererUsageExample = `
// In your renderer process (e.g., React component)

// Invoke main process
async function loadUserData() {
  const userData = await window.electronAPI.getUserData();
  console.log('User data:', userData);
}

async function saveUserData() {
  const success = await window.electronAPI.saveUserData({
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  });
  console.log('Save success:', success);
}

// Listen to main process events
window.electronAPI.onProgressUpdate((data) => {
  console.log('Progress:', data.progress, data.status);
  // Update UI with progress
});

window.electronAPI.onThemeChanged((data) => {
  console.log('Theme changed to:', data.theme);
  // Update theme
});

// Perform async task with progress
async function runTask() {
  const result = await window.electronAPI.performAsyncTask('data-processing');
  console.log('Task result:', result);
}

// Clean up listeners when component unmounts
useEffect(() => {
  const progressHandler = (data) => {
    console.log('Progress:', data);
  };

  window.electronAPI.onProgressUpdate(progressHandler);

  return () => {
    window.electronAPI.removeAllListeners('progress-update');
  };
}, []);
`;

// ============== Initialize IPC ==============

export function initializeIPC(mainWindow: BrowserWindow): void {
  const messenger = new MainToRendererMessenger();
  messenger.setMainWindow(mainWindow);

  const handler = new RendererToMainHandler();
  handler.setupHandlers();

  const twoWayHandler = new TwoWayIPCHandler(messenger);
  twoWayHandler.setupRequestResponse();
  twoWayHandler.setupStreaming();

  console.log('IPC handlers initialized');
}
