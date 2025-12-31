/**
 * Electron Main Process Patterns
 *
 * This example demonstrates essential patterns for the Electron main process,
 * including window management, app lifecycle, native dialogs, and system integration.
 *
 * Key Concepts:
 * - Application lifecycle management
 * - Window creation and management
 * - Native dialogs and notifications
 * - App menu and tray integration
 * - Auto-updater integration
 * - Deep linking
 */

import { app, BrowserWindow, dialog, Notification, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

// ============== Window Manager ==============

class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private mainWindow: BrowserWindow | null = null;

  /**
   * Create the main application window
   */
  createMainWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: '#1a1a2e',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        // Enable web security
        webSecurity: true,
      },
      // Modern window appearance
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 10 },
      frame: process.platform === 'darwin',
      // Window icon (Windows/Linux)
      icon: path.join(__dirname, '../assets/icon.png'),
      // Show window when ready to prevent flickering
      show: false,
    });

    // Show window when ready to prevent flickering
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Open external links in default browser
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    // Window event handlers
    mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.windows.delete('main');
    });

    // Save window state on close
    mainWindow.on('close', async () => {
      await this.saveWindowState(mainWindow);
    });

    this.mainWindow = mainWindow;
    this.windows.set('main', mainWindow);

    return mainWindow;
  }

  /**
   * Create a child window (modal, preferences, etc.)
   */
  createChildWindow(
    options: {
      width?: number;
      height?: number;
      modal?: boolean;
      url?: string;
      file?: string;
    }
  ): BrowserWindow {
    const childWindow = new BrowserWindow({
      width: options.width || 600,
      height: options.height || 400,
      parent: this.mainWindow || undefined,
      modal: options.modal || false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: false,
    });

    childWindow.once('ready-to-show', () => {
      childWindow.show();
    });

    if (options.url) {
      childWindow.loadURL(options.url);
    } else if (options.file) {
      childWindow.loadFile(options.file);
    }

    return childWindow;
  }

  /**
   * Save window state to restore on next launch
   */
  private async saveWindowState(window: BrowserWindow): Promise<void> {
    try {
      const bounds = window.getBounds();
      const state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: window.isMaximized(),
        isFullScreen: window.isFullScreen(),
      };

      const userDataPath = app.getPath('userData');
      const statePath = path.join(userDataPath, 'window-state.json');
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  /**
   * Restore window state from previous session
   */
  async restoreWindowState(window: BrowserWindow): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const statePath = path.join(userDataPath, 'window-state.json');
      const data = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(data);

      window.setBounds({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
      });

      if (state.isMaximized) {
        window.maximize();
      }

      if (state.isFullScreen) {
        window.setFullScreen(true);
      }
    } catch (error) {
      // State file doesn't exist or is invalid - use defaults
      console.log('No window state to restore');
    }
  }

  /**
   * Get the main window
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Get a specific window
   */
  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  /**
   * Close all windows
   */
  closeAll(): void {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
  }
}

// ============== Dialog Manager ==============

class DialogManager {
  /**
   * Show open file dialog
   */
  static async showOpenDialog(
    window: BrowserWindow,
    options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
      properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
    }
  ): Promise<string[] | null> {
    const result = await dialog.showOpenDialog(window, {
      title: options.title || 'Open File',
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: options.properties || ['openFile'],
    });

    return result.canceled ? null : result.filePaths;
  }

  /**
   * Show save file dialog
   */
  static async showSaveDialog(
    window: BrowserWindow,
    options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }
  ): Promise<string | null> {
    const result = await dialog.showSaveDialog(window, {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath || 'untitled.txt',
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    return result.canceled ? null : result.filePath;
  }

  /**
   * Show message dialog
   */
  static async showMessage(
    window: BrowserWindow,
    options: {
      type?: 'none' | 'info' | 'error' | 'question' | 'warning';
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
      defaultId?: number;
      cancelId?: number;
    }
  ): Promise<number> {
    const result = await dialog.showMessageBox(window, {
      type: options.type || 'info',
      title: options.title || 'Message',
      message: options.message,
      detail: options.detail,
      buttons: options.buttons || ['OK'],
      defaultId: options.defaultId || 0,
      cancelId: options.cancelId,
    });

    return result.response;
  }

  /**
   * Show confirmation dialog
   */
  static async showConfirmation(
    window: BrowserWindow,
    message: string,
    detail?: string
  ): Promise<boolean> {
    const result = await dialog.showMessageBox(window, {
      type: 'question',
      title: 'Confirm',
      message,
      detail,
      buttons: ['Cancel', 'OK'],
      defaultId: 1,
      cancelId: 0,
    });

    return result.response === 1;
  }

  /**
   * Show error dialog
   */
  static showError(title: string, content: string): void {
    dialog.showErrorBox(title, content);
  }
}

// ============== Notification Manager ==============

class NotificationManager {
  /**
   * Show a native notification
   */
  static show(options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    urgency?: 'normal' | 'critical' | 'low';
    timeoutType?: 'default' | 'never';
    actions?: { type: string; text: string }[];
  }): Notification {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      actions: options.actions,
    });

    notification.show();
    return notification;
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return Notification.isSupported();
  }
}

// ============== App Lifecycle Manager ==============

class AppLifecycleManager {
  private windowManager: WindowManager;
  private shuttingDown: boolean = false;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    this.setupLifecycleHandlers();
  }

  /**
   * Setup application lifecycle event handlers
   */
  private setupLifecycleHandlers(): void {
    // App is ready
    app.on('ready', () => {
      console.log('App is ready');
    });

    // All windows closed
    app.on('window-all-closed', () => {
      // On macOS, apps typically stay open even when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // App activated (macOS)
    app.on('activate', () => {
      // Re-create window when dock icon is clicked and no windows are open
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow();
      }
    });

    // Before quit
    app.on('before-quit', async (event) => {
      if (!this.shuttingDown) {
        event.preventDefault();
        await this.performCleanup();
        this.shuttingDown = true;
        app.quit();
      }
    });

    // GPU process crashed
    app.on('gpu-process-crashed', (event, killed) => {
      console.error('GPU process crashed', { killed });
    });

    // Renderer process crashed
    app.on('render-process-gone', (event, webContents, details) => {
      console.error('Renderer process gone', details);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      DialogManager.showError('Application Error', error.message);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
    });
  }

  /**
   * Perform cleanup before quitting
   */
  private async performCleanup(): Promise<void> {
    console.log('Performing cleanup...');

    // Save any pending data
    // Close connections
    // etc.

    // Give a moment for cleanup to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Request single instance lock
   */
  requestSingleInstanceLock(): boolean {
    const gotLock = app.requestSingleInstanceLock();

    if (!gotLock) {
      console.log('Another instance is already running');
      return false;
    }

    // Handle second instance
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, focus our window
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });

    return true;
  }

  /**
   * Set up deep linking (custom protocol)
   */
  setupDeepLinking(protocol: string): void {
    // Set as default protocol handler
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(protocol, process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient(protocol);
    }

    // Handle deep links on macOS
    app.on('open-url', (event, url) => {
      event.preventDefault();
      console.log('Deep link received:', url);
      // Handle the URL
      this.handleDeepLink(url);
    });

    // Handle deep links on Windows/Linux
    const argv = process.argv;
    const url = argv.find((arg) => arg.startsWith(`${protocol}://`));
    if (url) {
      this.handleDeepLink(url);
    }
  }

  /**
   * Handle deep link URL
   */
  private handleDeepLink(url: string): void {
    console.log('Handling deep link:', url);

    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('deep-link', url);
    }
  }
}

// ============== Auto Updater Integration ==============

class AutoUpdaterManager {
  /**
   * Setup auto updater (using electron-updater package)
   */
  static setup(): void {
    // This is a placeholder - you would use electron-updater in a real app
    // import { autoUpdater } from 'electron-updater';

    /*
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      NotificationManager.show({
        title: 'Update Available',
        body: 'A new version is available and will be downloaded.',
      });
    });

    autoUpdater.on('update-not-available', () => {
      console.log('No updates available');
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log(`Download progress: ${progress.percent}%`);
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded');
      const notification = NotificationManager.show({
        title: 'Update Ready',
        body: 'A new version has been downloaded. Restart to install.',
      });

      notification.on('click', () => {
        autoUpdater.quitAndInstall();
      });
    });

    // Check for updates on startup (production only)
    if (process.env.NODE_ENV === 'production') {
      autoUpdater.checkForUpdatesAndNotify();
    }
    */
  }
}

// ============== Main Application Setup ==============

class ElectronApp {
  private windowManager: WindowManager;
  private lifecycleManager: AppLifecycleManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.lifecycleManager = new AppLifecycleManager(this.windowManager);
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    // Ensure single instance
    if (!this.lifecycleManager.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    // Setup deep linking (optional)
    // this.lifecycleManager.setupDeepLinking('myapp');

    // Wait for app to be ready
    await app.whenReady();

    // Setup auto updater (optional)
    // AutoUpdaterManager.setup();

    // Create main window
    const mainWindow = this.windowManager.createMainWindow();

    // Restore window state
    await this.windowManager.restoreWindowState(mainWindow);

    // Show welcome notification
    if (NotificationManager.isSupported()) {
      NotificationManager.show({
        title: 'Welcome!',
        body: 'Your application is ready to use.',
      });
    }
  }
}

// ============== Application Entry Point ==============

const electronApp = new ElectronApp();
electronApp.initialize().catch((error) => {
  console.error('Failed to initialize app:', error);
  app.quit();
});

// ============== Export ==============

export {
  WindowManager,
  DialogManager,
  NotificationManager,
  AppLifecycleManager,
  AutoUpdaterManager,
  ElectronApp,
};
