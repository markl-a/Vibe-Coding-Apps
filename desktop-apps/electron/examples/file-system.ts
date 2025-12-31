/**
 * Electron File System Operations
 *
 * This example demonstrates file system operations in Electron,
 * including file dialogs, reading/writing files, and file watching.
 *
 * Key Concepts:
 * - Open File Dialog
 * - Save File Dialog
 * - Directory Selection
 * - Reading Files
 * - Writing Files
 * - File Watching
 * - Drag and Drop
 */

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainInvokeEvent,
  OpenDialogOptions,
  SaveDialogOptions,
} from 'electron';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { watch, FSWatcher } from 'fs';

// ============== Type Definitions ==============

interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  mtime: Date;
  isDirectory: boolean;
}

interface ReadFileResult {
  success: boolean;
  content?: string;
  error?: string;
  stats?: FileInfo;
}

interface WriteFileResult {
  success: boolean;
  path?: string;
  error?: string;
}

interface DirectoryContent {
  path: string;
  files: FileInfo[];
  directories: FileInfo[];
}

// ============== File Dialog Manager ==============

/**
 * Manage file dialogs for opening and saving files
 */
export class FileDialogManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Show open file dialog
   */
  async showOpenFileDialog(
    options?: Partial<OpenDialogOptions>
  ): Promise<string[] | null> {
    const defaultOptions: OpenDialogOptions = {
      title: 'Open File',
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    };

    const result = await dialog.showOpenDialog(this.mainWindow, {
      ...defaultOptions,
      ...options,
    });

    return result.canceled ? null : result.filePaths;
  }

  /**
   * Show open multiple files dialog
   */
  async showOpenMultipleFilesDialog(
    options?: Partial<OpenDialogOptions>
  ): Promise<string[] | null> {
    return this.showOpenFileDialog({
      ...options,
      properties: ['openFile', 'multiSelections'],
    });
  }

  /**
   * Show open directory dialog
   */
  async showOpenDirectoryDialog(
    options?: Partial<OpenDialogOptions>
  ): Promise<string[] | null> {
    const defaultOptions: OpenDialogOptions = {
      title: 'Select Directory',
      properties: ['openDirectory'],
    };

    const result = await dialog.showOpenDialog(this.mainWindow, {
      ...defaultOptions,
      ...options,
    });

    return result.canceled ? null : result.filePaths;
  }

  /**
   * Show save file dialog
   */
  async showSaveFileDialog(
    defaultPath?: string,
    options?: Partial<SaveDialogOptions>
  ): Promise<string | null> {
    const defaultOptions: SaveDialogOptions = {
      title: 'Save File',
      defaultPath: defaultPath || 'untitled.txt',
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    };

    const result = await dialog.showSaveDialog(this.mainWindow, {
      ...defaultOptions,
      ...options,
    });

    return result.canceled ? null : result.filePath || null;
  }

  /**
   * Show save with filters
   */
  async showSaveWithFilters(
    filters: { name: string; extensions: string[] }[],
    defaultPath?: string
  ): Promise<string | null> {
    return this.showSaveFileDialog(defaultPath, { filters });
  }
}

// ============== File Operations Manager ==============

/**
 * Handle file reading, writing, and manipulation
 */
export class FileOperationsManager {
  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<ReadFileResult> {
    try {
      // Validate file path
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      // Check if file exists
      const stats = await fs.stat(normalizedPath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: 'Path is not a file',
        };
      }

      // Read file
      const content = await fs.readFile(normalizedPath, 'utf-8');

      // Get file info
      const fileInfo = this.getFileInfo(normalizedPath, stats);

      return {
        success: true,
        content,
        stats: fileInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Read file as buffer (for binary files)
   */
  async readFileAsBuffer(filePath: string): Promise<Buffer | null> {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid file path');
      }

      return await fs.readFile(normalizedPath);
    } catch (error) {
      console.error('Failed to read file as buffer:', error);
      return null;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<WriteFileResult> {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      // Ensure directory exists
      const directory = path.dirname(normalizedPath);
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(normalizedPath, content, 'utf-8');

      return {
        success: true,
        path: normalizedPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Write file as buffer (for binary files)
   */
  async writeFileAsBuffer(filePath: string, buffer: Buffer): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid file path');
      }

      const directory = path.dirname(normalizedPath);
      await fs.mkdir(directory, { recursive: true });

      await fs.writeFile(normalizedPath, buffer);
      return true;
    } catch (error) {
      console.error('Failed to write file as buffer:', error);
      return false;
    }
  }

  /**
   * Append to file
   */
  async appendToFile(filePath: string, content: string): Promise<WriteFileResult> {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      await fs.appendFile(normalizedPath, content, 'utf-8');

      return {
        success: true,
        path: normalizedPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<boolean> {
    try {
      const normalizedSource = path.normalize(sourcePath);
      const normalizedDest = path.normalize(destPath);

      if (!this.isValidPath(normalizedSource) || !this.isValidPath(normalizedDest)) {
        throw new Error('Invalid file path');
      }

      await fs.copyFile(normalizedSource, normalizedDest);
      return true;
    } catch (error) {
      console.error('Failed to copy file:', error);
      return false;
    }
  }

  /**
   * Move/rename file
   */
  async moveFile(sourcePath: string, destPath: string): Promise<boolean> {
    try {
      const normalizedSource = path.normalize(sourcePath);
      const normalizedDest = path.normalize(destPath);

      if (!this.isValidPath(normalizedSource) || !this.isValidPath(normalizedDest)) {
        throw new Error('Invalid file path');
      }

      await fs.rename(normalizedSource, normalizedDest);
      return true;
    } catch (error) {
      console.error('Failed to move file:', error);
      return false;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid file path');
      }

      await fs.unlink(normalizedPath);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filePath);
      await fs.access(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getStats(filePath: string): Promise<FileInfo | null> {
    try {
      const normalizedPath = path.normalize(filePath);
      const stats = await fs.stat(normalizedPath);
      return this.getFileInfo(normalizedPath, stats);
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<DirectoryContent | null> {
    try {
      const normalizedPath = path.normalize(dirPath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid directory path');
      }

      const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
      const files: FileInfo[] = [];
      const directories: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(normalizedPath, entry.name);
        const stats = await fs.stat(fullPath);
        const fileInfo = this.getFileInfo(fullPath, stats);

        if (entry.isDirectory()) {
          directories.push(fileInfo);
        } else {
          files.push(fileInfo);
        }
      }

      return {
        path: normalizedPath,
        files,
        directories,
      };
    } catch (error) {
      console.error('Failed to list directory:', error);
      return null;
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(dirPath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid directory path');
      }

      await fs.mkdir(normalizedPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Failed to create directory:', error);
      return false;
    }
  }

  /**
   * Delete directory
   */
  async deleteDirectory(dirPath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(dirPath);
      if (!this.isValidPath(normalizedPath)) {
        throw new Error('Invalid directory path');
      }

      await fs.rm(normalizedPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Failed to delete directory:', error);
      return false;
    }
  }

  /**
   * Get file info from stats
   */
  private getFileInfo(filePath: string, stats: fsSync.Stats): FileInfo {
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      mtime: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  }

  /**
   * Validate file path (prevent path traversal)
   */
  private isValidPath(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    // Add additional security checks here
    return !normalized.includes('..');
  }
}

// ============== File Watcher Manager ==============

/**
 * Watch files and directories for changes
 */
export class FileWatcherManager {
  private watchers: Map<string, FSWatcher> = new Map();
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Watch a file for changes
   */
  watchFile(
    filePath: string,
    callback?: (eventType: string, filename: string | null) => void
  ): boolean {
    try {
      if (this.watchers.has(filePath)) {
        console.warn(`Already watching: ${filePath}`);
        return false;
      }

      const watcher = watch(filePath, (eventType, filename) => {
        console.log(`File changed: ${eventType} - ${filename}`);

        // Send to renderer
        this.mainWindow.webContents.send('file-changed', {
          path: filePath,
          eventType,
          filename,
        });

        // Custom callback
        if (callback) {
          callback(eventType, filename);
        }
      });

      this.watchers.set(filePath, watcher);
      return true;
    } catch (error) {
      console.error('Failed to watch file:', error);
      return false;
    }
  }

  /**
   * Watch a directory for changes
   */
  watchDirectory(
    dirPath: string,
    callback?: (eventType: string, filename: string | null) => void
  ): boolean {
    try {
      if (this.watchers.has(dirPath)) {
        console.warn(`Already watching: ${dirPath}`);
        return false;
      }

      const watcher = watch(
        dirPath,
        { recursive: true },
        (eventType, filename) => {
          console.log(`Directory changed: ${eventType} - ${filename}`);

          // Send to renderer
          this.mainWindow.webContents.send('directory-changed', {
            path: dirPath,
            eventType,
            filename,
          });

          // Custom callback
          if (callback) {
            callback(eventType, filename);
          }
        }
      );

      this.watchers.set(dirPath, watcher);
      return true;
    } catch (error) {
      console.error('Failed to watch directory:', error);
      return false;
    }
  }

  /**
   * Stop watching a path
   */
  unwatch(filePath: string): boolean {
    const watcher = this.watchers.get(filePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(filePath);
      return true;
    }
    return false;
  }

  /**
   * Stop watching all paths
   */
  unwatchAll(): void {
    this.watchers.forEach((watcher) => {
      watcher.close();
    });
    this.watchers.clear();
  }
}

// ============== IPC Handlers Setup ==============

/**
 * Setup IPC handlers for file operations
 */
export function setupFileSystemIPC(mainWindow: BrowserWindow): void {
  const dialogManager = new FileDialogManager(mainWindow);
  const fileOps = new FileOperationsManager();
  const fileWatcher = new FileWatcherManager(mainWindow);

  // File dialogs
  ipcMain.handle('show-open-dialog', async (event: IpcMainInvokeEvent, options) => {
    return await dialogManager.showOpenFileDialog(options);
  });

  ipcMain.handle('show-open-multiple-dialog', async (event: IpcMainInvokeEvent, options) => {
    return await dialogManager.showOpenMultipleFilesDialog(options);
  });

  ipcMain.handle('show-open-directory-dialog', async (event: IpcMainInvokeEvent, options) => {
    return await dialogManager.showOpenDirectoryDialog(options);
  });

  ipcMain.handle('show-save-dialog', async (event: IpcMainInvokeEvent, defaultPath, options) => {
    return await dialogManager.showSaveFileDialog(defaultPath, options);
  });

  // File operations
  ipcMain.handle('read-file', async (event: IpcMainInvokeEvent, filePath: string) => {
    return await fileOps.readFile(filePath);
  });

  ipcMain.handle('write-file', async (event: IpcMainInvokeEvent, filePath: string, content: string) => {
    return await fileOps.writeFile(filePath, content);
  });

  ipcMain.handle('append-to-file', async (event: IpcMainInvokeEvent, filePath: string, content: string) => {
    return await fileOps.appendToFile(filePath, content);
  });

  ipcMain.handle('copy-file', async (event: IpcMainInvokeEvent, source: string, dest: string) => {
    return await fileOps.copyFile(source, dest);
  });

  ipcMain.handle('move-file', async (event: IpcMainInvokeEvent, source: string, dest: string) => {
    return await fileOps.moveFile(source, dest);
  });

  ipcMain.handle('delete-file', async (event: IpcMainInvokeEvent, filePath: string) => {
    return await fileOps.deleteFile(filePath);
  });

  ipcMain.handle('file-exists', async (event: IpcMainInvokeEvent, filePath: string) => {
    return await fileOps.fileExists(filePath);
  });

  ipcMain.handle('get-file-stats', async (event: IpcMainInvokeEvent, filePath: string) => {
    return await fileOps.getStats(filePath);
  });

  ipcMain.handle('list-directory', async (event: IpcMainInvokeEvent, dirPath: string) => {
    return await fileOps.listDirectory(dirPath);
  });

  ipcMain.handle('create-directory', async (event: IpcMainInvokeEvent, dirPath: string) => {
    return await fileOps.createDirectory(dirPath);
  });

  ipcMain.handle('delete-directory', async (event: IpcMainInvokeEvent, dirPath: string) => {
    return await fileOps.deleteDirectory(dirPath);
  });

  // File watching
  ipcMain.handle('watch-file', async (event: IpcMainInvokeEvent, filePath: string) => {
    return fileWatcher.watchFile(filePath);
  });

  ipcMain.handle('watch-directory', async (event: IpcMainInvokeEvent, dirPath: string) => {
    return fileWatcher.watchDirectory(dirPath);
  });

  ipcMain.handle('unwatch', async (event: IpcMainInvokeEvent, filePath: string) => {
    return fileWatcher.unwatch(filePath);
  });

  // Cleanup on app quit
  app.on('before-quit', () => {
    fileWatcher.unwatchAll();
  });

  console.log('File system IPC handlers initialized');
}
