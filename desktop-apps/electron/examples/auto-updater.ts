/**
 * Electron Auto-Updater
 *
 * This example demonstrates how to implement automatic updates in Electron
 * applications using electron-updater (based on Squirrel).
 *
 * Key Concepts:
 * - Check for Updates
 * - Download Updates
 * - Install Updates
 * - Update Progress
 * - Update Notifications
 * - Error Handling
 * - Release Channels (stable, beta, alpha)
 */

import {
  app,
  BrowserWindow,
  dialog,
  Notification,
  ipcMain,
  IpcMainInvokeEvent,
} from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import * as path from 'path';

// ============== Type Definitions ==============

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  version: string | null;
  progress: number;
}

interface UpdateConfig {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
  channel: 'latest' | 'beta' | 'alpha';
}

// ============== Auto Updater Manager ==============

/**
 * Manage automatic updates for the application
 */
export class AutoUpdaterManager {
  private mainWindow: BrowserWindow;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    version: null,
    progress: 0,
  };
  private config: UpdateConfig;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor(mainWindow: BrowserWindow, config?: Partial<UpdateConfig>) {
    this.mainWindow = mainWindow;
    this.config = {
      autoDownload: config?.autoDownload ?? true,
      autoInstallOnAppQuit: config?.autoInstallOnAppQuit ?? true,
      allowPrerelease: config?.allowPrerelease ?? false,
      allowDowngrade: config?.allowDowngrade ?? false,
      channel: config?.channel ?? 'latest',
    };

    this.setupAutoUpdater();
    this.setupEventListeners();
  }

  /**
   * Setup auto-updater configuration
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = this.config.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstallOnAppQuit;
    autoUpdater.allowPrerelease = this.config.allowPrerelease;
    autoUpdater.allowDowngrade = this.config.allowDowngrade;

    // Set update channel
    autoUpdater.channel = this.config.channel;

    // Configure update server (optional)
    // autoUpdater.setFeedURL({
    //   provider: 'github',
    //   owner: 'your-username',
    //   repo: 'your-repo',
    //   token: process.env.GH_TOKEN, // Optional for private repos
    // });

    // For S3 bucket:
    // autoUpdater.setFeedURL({
    //   provider: 's3',
    //   bucket: 'your-bucket',
    //   region: 'us-east-1',
    //   path: 'updates',
    // });

    // For generic HTTP server:
    // autoUpdater.setFeedURL({
    //   provider: 'generic',
    //   url: 'https://your-server.com/updates',
    // });

    // Enable logging
    autoUpdater.logger = console;
  }

  /**
   * Setup auto-updater event listeners
   */
  private setupEventListeners(): void {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
      this.updateStatus.checking = true;
      this.sendStatusToRenderer();

      this.showNotification('Checking for Updates', 'Looking for new versions...');
    });

    // Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('Update available:', info);
      this.updateStatus.checking = false;
      this.updateStatus.available = true;
      this.updateStatus.version = info.version;
      this.sendStatusToRenderer();

      this.showUpdateAvailableDialog(info);
    });

    // Update not available
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('Update not available:', info);
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.sendStatusToRenderer();

      // Only show notification if user manually checked
      if (!this.updateCheckInterval) {
        this.showNotification(
          'No Updates Available',
          'You are running the latest version.'
        );
      }
    });

    // Download progress
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      console.log('Download progress:', progress);
      this.updateStatus.downloading = true;
      this.updateStatus.progress = Math.round(progress.percent);
      this.sendStatusToRenderer();

      // Update window title with progress
      this.mainWindow.setTitle(
        `Downloading update... ${this.updateStatus.progress}%`
      );
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('Update downloaded:', info);
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.progress = 100;
      this.sendStatusToRenderer();

      // Reset window title
      this.mainWindow.setTitle(app.name);

      this.showUpdateDownloadedDialog(info);
    });

    // Error occurred
    autoUpdater.on('error', (error: Error) => {
      console.error('Update error:', error);
      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = error.message;
      this.sendStatusToRenderer();

      this.showUpdateErrorDialog(error);
    });
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      // Don't check if already checking, downloading, or downloaded
      if (
        this.updateStatus.checking ||
        this.updateStatus.downloading ||
        this.updateStatus.downloaded
      ) {
        console.log('Update check already in progress');
        return null;
      }

      console.log('Manually checking for updates...');
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo ?? null;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Download update
   */
  async downloadUpdate(): Promise<void> {
    try {
      console.log('Downloading update...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
    }
  }

  /**
   * Quit and install update
   */
  quitAndInstall(): void {
    console.log('Quitting and installing update...');

    // Close all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      window.close();
    });

    // Install update
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Start periodic update checks
   */
  startPeriodicChecks(intervalMinutes: number = 60): void {
    console.log(`Starting periodic update checks (every ${intervalMinutes} minutes)`);

    // Clear existing interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check immediately
    this.checkForUpdates();

    // Check periodically
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      console.log('Stopped periodic update checks');
    }
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupAutoUpdater();
  }

  /**
   * Send status to renderer process
   */
  private sendStatusToRenderer(): void {
    this.mainWindow.webContents.send('update-status', this.updateStatus);
  }

  /**
   * Show notification
   */
  private showNotification(title: string, body: string): void {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../assets/icon.png'),
      });
      notification.show();
    }
  }

  /**
   * Show update available dialog
   */
  private async showUpdateAvailableDialog(info: UpdateInfo): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version ${info.version} is available!`,
      detail: `Current version: ${app.getVersion()}\n\nRelease notes:\n${info.releaseNotes || 'No release notes available.'}`,
      buttons: this.config.autoDownload
        ? ['OK', 'View Details']
        : ['Download Now', 'Later', 'View Details'],
      defaultId: 0,
      cancelId: this.config.autoDownload ? 0 : 1,
    });

    // View details
    if (
      result.response === 1 ||
      (result.response === 2 && !this.config.autoDownload)
    ) {
      require('electron').shell.openExternal(
        `https://github.com/your-username/your-repo/releases/tag/v${info.version}`
      );
    }

    // Download now (if not auto-download)
    if (result.response === 0 && !this.config.autoDownload) {
      this.downloadUpdate();
    }
  }

  /**
   * Show update downloaded dialog
   */
  private async showUpdateDownloadedDialog(info: UpdateInfo): Promise<void> {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded.',
      detail: `Version ${info.version} is ready to install. The application will restart to complete the installation.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      this.quitAndInstall();
    }
  }

  /**
   * Show update error dialog
   */
  private showUpdateErrorDialog(error: Error): void {
    dialog.showErrorBox('Update Error', `Failed to update:\n\n${error.message}`);
  }
}

// ============== Update Settings Manager ==============

/**
 * Manage update settings and preferences
 */
export class UpdateSettingsManager {
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'update-settings.json');
  }

  /**
   * Load update settings
   */
  async loadSettings(): Promise<Partial<UpdateConfig>> {
    try {
      const fs = require('fs/promises');
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return defaults if file doesn't exist
      return {
        autoDownload: true,
        autoInstallOnAppQuit: true,
        allowPrerelease: false,
        allowDowngrade: false,
        channel: 'latest',
      };
    }
  }

  /**
   * Save update settings
   */
  async saveSettings(settings: Partial<UpdateConfig>): Promise<boolean> {
    try {
      const fs = require('fs/promises');
      await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save update settings:', error);
      return false;
    }
  }
}

// ============== IPC Handlers Setup ==============

/**
 * Setup IPC handlers for auto-updater
 */
export function setupAutoUpdaterIPC(
  mainWindow: BrowserWindow,
  updaterManager: AutoUpdaterManager
): void {
  // Check for updates
  ipcMain.handle('check-for-updates', async () => {
    return await updaterManager.checkForUpdates();
  });

  // Download update
  ipcMain.handle('download-update', async () => {
    await updaterManager.downloadUpdate();
  });

  // Quit and install
  ipcMain.handle('quit-and-install', () => {
    updaterManager.quitAndInstall();
  });

  // Get update status
  ipcMain.handle('get-update-status', () => {
    return updaterManager.getStatus();
  });

  // Update config
  ipcMain.handle('update-config', (event: IpcMainInvokeEvent, config: Partial<UpdateConfig>) => {
    updaterManager.updateConfig(config);
  });

  console.log('Auto-updater IPC handlers initialized');
}

// ============== Initialize Auto-Updater ==============

export async function initializeAutoUpdater(
  mainWindow: BrowserWindow,
  options?: {
    checkOnStartup?: boolean;
    periodicCheckInterval?: number;
  }
): Promise<AutoUpdaterManager> {
  // Skip auto-updater in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Auto-updater disabled in development');
    return new AutoUpdaterManager(mainWindow, { autoDownload: false });
  }

  // Load settings
  const settingsManager = new UpdateSettingsManager();
  const settings = await settingsManager.loadSettings();

  // Create updater manager
  const updaterManager = new AutoUpdaterManager(mainWindow, settings);

  // Setup IPC handlers
  setupAutoUpdaterIPC(mainWindow, updaterManager);

  // Check for updates on startup
  if (options?.checkOnStartup !== false) {
    // Wait a bit before checking (let the app fully load)
    setTimeout(() => {
      updaterManager.checkForUpdates();
    }, 5000);
  }

  // Start periodic checks
  if (options?.periodicCheckInterval) {
    updaterManager.startPeriodicChecks(options.periodicCheckInterval);
  }

  console.log('Auto-updater initialized');

  return updaterManager;
}

// ============== Preload Script Example ==============

/**
 * Add to your preload.ts file
 */
export const preloadScript = `
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('updater', {
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getStatus: () => ipcRenderer.invoke('get-update-status'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  onStatusUpdate: (callback) => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
  },
});

// Type definitions
declare global {
  interface Window {
    updater: {
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<void>;
      quitAndInstall: () => Promise<void>;
      getStatus: () => Promise<UpdateStatus>;
      updateConfig: (config: Partial<UpdateConfig>) => Promise<void>;
      onStatusUpdate: (callback: (status: UpdateStatus) => void) => void;
    };
  }
}
`;

// ============== Renderer Usage Example ==============

/**
 * Example usage in renderer process
 */
export const rendererUsageExample = `
// React component example

import { useEffect, useState } from 'react';

function UpdateChecker() {
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    // Listen for update status changes
    window.updater.onStatusUpdate((status) => {
      setUpdateStatus(status);
    });

    // Get initial status
    window.updater.getStatus().then(setUpdateStatus);
  }, []);

  const handleCheckForUpdates = async () => {
    await window.updater.checkForUpdates();
  };

  const handleDownloadUpdate = async () => {
    await window.updater.downloadUpdate();
  };

  const handleInstallUpdate = async () => {
    await window.updater.quitAndInstall();
  };

  if (!updateStatus) return null;

  return (
    <div>
      {updateStatus.checking && <p>Checking for updates...</p>}

      {updateStatus.available && !updateStatus.downloaded && (
        <div>
          <p>New version {updateStatus.version} available!</p>
          {!updateStatus.downloading && (
            <button onClick={handleDownloadUpdate}>Download Update</button>
          )}
          {updateStatus.downloading && (
            <p>Downloading... {updateStatus.progress}%</p>
          )}
        </div>
      )}

      {updateStatus.downloaded && (
        <div>
          <p>Update ready to install!</p>
          <button onClick={handleInstallUpdate}>Restart and Install</button>
        </div>
      )}

      {updateStatus.error && (
        <p>Error: {updateStatus.error}</p>
      )}

      <button onClick={handleCheckForUpdates}>Check for Updates</button>
    </div>
  );
}
`;
