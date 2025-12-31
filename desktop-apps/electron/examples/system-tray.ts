/**
 * Electron System Tray and Notifications
 *
 * This example demonstrates how to create and manage system tray icons,
 * tray menus, and native notifications in Electron applications.
 *
 * Key Concepts:
 * - System Tray Icon
 * - Tray Menu
 * - Tray Events
 * - Native Notifications
 * - Badge Count (macOS/Linux)
 * - Flash Frame (Windows)
 */

import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  Notification,
  nativeImage,
  NativeImage,
} from 'electron';
import * as path from 'path';

// ============== Type Definitions ==============

interface TrayOptions {
  icon: string | NativeImage;
  tooltip?: string;
  title?: string;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string | NativeImage;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
  actions?: { type: string; text: string }[];
}

// ============== System Tray Manager ==============

/**
 * Manage system tray icon and menu
 */
export class SystemTrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private iconPath: string;

  constructor(mainWindow: BrowserWindow, iconPath: string) {
    this.mainWindow = mainWindow;
    this.iconPath = iconPath;
  }

  /**
   * Create system tray icon
   */
  createTray(options?: TrayOptions): Tray {
    // Create icon
    const icon = options?.icon || this.iconPath;
    const trayIcon =
      typeof icon === 'string' ? nativeImage.createFromPath(icon) : icon;

    // Resize icon for tray (16x16 or 32x32 for retina)
    const resizedIcon = trayIcon.resize({
      width: 16,
      height: 16,
    });

    // Create tray
    this.tray = new Tray(resizedIcon);

    // Set tooltip
    if (options?.tooltip) {
      this.tray.setToolTip(options.tooltip);
    }

    // Set title (macOS only)
    if (options?.title && process.platform === 'darwin') {
      this.tray.setTitle(options.title);
    }

    // Setup event listeners
    this.setupTrayEventListeners();

    // Create context menu
    this.createTrayMenu();

    return this.tray;
  }

  /**
   * Setup tray event listeners
   */
  private setupTrayEventListeners(): void {
    if (!this.tray) return;

    // Click event
    this.tray.on('click', (event, bounds) => {
      console.log('Tray clicked', bounds);

      // Toggle window visibility
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
      }
    });

    // Right-click event (Windows/Linux)
    this.tray.on('right-click', (event, bounds) => {
      console.log('Tray right-clicked', bounds);
      // Context menu will be shown automatically
    });

    // Double-click event
    this.tray.on('double-click', (event, bounds) => {
      console.log('Tray double-clicked', bounds);

      // Show and focus window
      this.mainWindow.show();
      this.mainWindow.focus();
    });

    // Mouse enter/leave (macOS)
    if (process.platform === 'darwin') {
      this.tray.on('mouse-enter', (event, bounds) => {
        console.log('Mouse entered tray icon');
      });

      this.tray.on('mouse-leave', (event, bounds) => {
        console.log('Mouse left tray icon');
      });
    }

    // Drop files event (macOS)
    if (process.platform === 'darwin') {
      this.tray.on('drop-files', (event, files) => {
        console.log('Files dropped on tray:', files);
        this.mainWindow.webContents.send('tray-files-dropped', files);
      });
    }
  }

  /**
   * Create tray context menu
   */
  createTrayMenu(): void {
    if (!this.tray) return;

    const menuTemplate: MenuItemConstructorOptions[] = [
      {
        label: 'Show App',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'New Note',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          this.mainWindow.webContents.send('tray-new-note');
        },
      },
      {
        label: 'Quick Capture',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => {
          this.mainWindow.webContents.send('tray-quick-capture');
        },
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        submenu: [
          {
            label: 'Start at Login',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
              app.setLoginItemSettings({
                openAtLogin: menuItem.checked,
              });
            },
          },
          {
            label: 'Show Notifications',
            type: 'checkbox',
            checked: true,
            click: (menuItem) => {
              this.mainWindow.webContents.send(
                'tray-toggle-notifications',
                menuItem.checked
              );
            },
          },
          { type: 'separator' },
          {
            label: 'Theme',
            submenu: [
              {
                label: 'Light',
                type: 'radio',
                click: () => {
                  this.mainWindow.webContents.send('tray-set-theme', 'light');
                },
              },
              {
                label: 'Dark',
                type: 'radio',
                checked: true,
                click: () => {
                  this.mainWindow.webContents.send('tray-set-theme', 'dark');
                },
              },
              {
                label: 'System',
                type: 'radio',
                click: () => {
                  this.mainWindow.webContents.send('tray-set-theme', 'system');
                },
              },
            ],
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'About',
        click: () => {
          this.showAboutWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ];

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Update tray menu dynamically
   */
  updateTrayMenu(items: MenuItemConstructorOptions[]): void {
    if (!this.tray) return;

    const menu = Menu.buildFromTemplate(items);
    this.tray.setContextMenu(menu);
  }

  /**
   * Add menu item to tray
   */
  addMenuItem(item: MenuItemConstructorOptions): void {
    if (!this.tray) return;

    const currentMenu = this.tray.getContextMenu();
    if (currentMenu) {
      const newItem = new MenuItem(item);
      currentMenu.append(newItem);
      this.tray.setContextMenu(currentMenu);
    }
  }

  /**
   * Update tray icon
   */
  updateIcon(iconPath: string | NativeImage): void {
    if (!this.tray) return;

    const icon =
      typeof iconPath === 'string'
        ? nativeImage.createFromPath(iconPath)
        : iconPath;

    const resizedIcon = icon.resize({ width: 16, height: 16 });
    this.tray.setImage(resizedIcon);
  }

  /**
   * Update tray tooltip
   */
  updateTooltip(tooltip: string): void {
    if (!this.tray) return;
    this.tray.setToolTip(tooltip);
  }

  /**
   * Update tray title (macOS only)
   */
  updateTitle(title: string): void {
    if (!this.tray || process.platform !== 'darwin') return;
    this.tray.setTitle(title);
  }

  /**
   * Show balloon (Windows only)
   */
  displayBalloon(options: { title: string; content: string; icon?: NativeImage }): void {
    if (!this.tray || process.platform !== 'win32') return;

    this.tray.displayBalloon({
      title: options.title,
      content: options.content,
      icon: options.icon,
    });
  }

  /**
   * Remove balloon (Windows only)
   */
  removeBalloon(): void {
    if (!this.tray || process.platform !== 'win32') return;
    this.tray.removeBalloon();
  }

  /**
   * Destroy tray icon
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * Show about window
   */
  private showAboutWindow(): void {
    this.mainWindow.webContents.send('tray-show-about');
  }

  /**
   * Get tray bounds (useful for positioning windows)
   */
  getBounds(): Electron.Rectangle | undefined {
    return this.tray?.getBounds();
  }
}

// ============== Notification Manager ==============

/**
 * Manage native notifications
 */
export class NotificationManager {
  private mainWindow: BrowserWindow;
  private notificationQueue: Notification[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return Notification.isSupported();
  }

  /**
   * Show a notification
   */
  show(options: NotificationOptions): Notification {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      actions: options.actions,
    });

    // Setup event listeners
    notification.on('show', () => {
      console.log('Notification shown:', options.title);
    });

    notification.on('click', () => {
      console.log('Notification clicked:', options.title);

      // Show and focus window
      this.mainWindow.show();
      this.mainWindow.focus();

      // Send event to renderer
      this.mainWindow.webContents.send('notification-clicked', options);
    });

    notification.on('close', () => {
      console.log('Notification closed:', options.title);
    });

    notification.on('action', (event, index) => {
      console.log('Notification action clicked:', index);
      this.mainWindow.webContents.send('notification-action', {
        notification: options,
        actionIndex: index,
      });
    });

    notification.on('reply', (event, reply) => {
      console.log('Notification reply:', reply);
      this.mainWindow.webContents.send('notification-reply', {
        notification: options,
        reply,
      });
    });

    notification.show();
    this.notificationQueue.push(notification);

    return notification;
  }

  /**
   * Show simple notification
   */
  showSimple(title: string, body: string): void {
    this.show({ title, body });
  }

  /**
   * Show notification with icon
   */
  showWithIcon(title: string, body: string, iconPath: string): void {
    this.show({ title, body, icon: iconPath });
  }

  /**
   * Show critical notification
   */
  showCritical(title: string, body: string): void {
    this.show({
      title,
      body,
      urgency: 'critical',
      timeoutType: 'never',
    });
  }

  /**
   * Show notification with actions (macOS)
   */
  showWithActions(
    title: string,
    body: string,
    actions: { type: string; text: string }[]
  ): void {
    this.show({
      title,
      body,
      actions,
    });
  }

  /**
   * Close all notifications
   */
  closeAll(): void {
    this.notificationQueue.forEach((notification) => {
      notification.close();
    });
    this.notificationQueue = [];
  }
}

// ============== Badge Manager (macOS/Linux) ==============

/**
 * Manage app badge count
 */
export class BadgeManager {
  private mainWindow: BrowserWindow;
  private count: number = 0;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Set badge count
   */
  setCount(count: number): void {
    this.count = count;

    // macOS - Dock badge
    if (process.platform === 'darwin') {
      if (count > 0) {
        app.dock.setBadge(count.toString());
      } else {
        app.dock.setBadge('');
      }
    }

    // Windows - Overlay icon
    if (process.platform === 'win32') {
      if (count > 0) {
        // Create a badge icon with the count
        const badge = this.createBadgeIcon(count);
        this.mainWindow.setOverlayIcon(badge, count.toString());
      } else {
        this.mainWindow.setOverlayIcon(null, '');
      }
    }

    // Linux - Unity launcher (if available)
    if (process.platform === 'linux') {
      this.mainWindow.setBadgeCount(count);
    }
  }

  /**
   * Increment badge count
   */
  increment(): void {
    this.setCount(this.count + 1);
  }

  /**
   * Decrement badge count
   */
  decrement(): void {
    this.setCount(Math.max(0, this.count - 1));
  }

  /**
   * Clear badge
   */
  clear(): void {
    this.setCount(0);
  }

  /**
   * Get current count
   */
  getCount(): number {
    return this.count;
  }

  /**
   * Create badge icon (Windows)
   */
  private createBadgeIcon(count: number): NativeImage {
    // Create a simple badge icon
    // In a real app, you would use a proper image or canvas to create this
    const canvas = require('canvas');
    const c = canvas.createCanvas(16, 16);
    const ctx = c.getContext('2d');

    // Draw red circle
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw count text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 9 ? '9+' : count.toString(), 8, 8);

    return nativeImage.createFromDataURL(c.toDataURL());
  }
}

// ============== Flash Frame Manager (Windows) ==============

/**
 * Flash window frame to get attention
 */
export class FlashFrameManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Flash window frame
   */
  flash(): void {
    if (!this.mainWindow.isFocused()) {
      this.mainWindow.flashFrame(true);
    }
  }

  /**
   * Stop flashing
   */
  stop(): void {
    this.mainWindow.flashFrame(false);
  }

  /**
   * Flash once
   */
  flashOnce(): void {
    this.mainWindow.once('focus', () => {
      this.stop();
    });
    this.flash();
  }
}

// ============== Initialize System Tray ==============

export function initializeSystemTray(mainWindow: BrowserWindow): SystemTrayManager {
  // Get icon path
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');

  // Create tray manager
  const trayManager = new SystemTrayManager(mainWindow, iconPath);

  // Create tray
  trayManager.createTray({
    icon: iconPath,
    tooltip: 'My Electron App',
    title: process.platform === 'darwin' ? '🚀' : undefined,
  });

  // Create notification manager
  const notificationManager = new NotificationManager(mainWindow);

  // Show welcome notification
  if (NotificationManager.isSupported()) {
    notificationManager.showSimple(
      'App Started',
      'Your application is running in the system tray.'
    );
  }

  // Create badge manager
  const badgeManager = new BadgeManager(mainWindow);

  // Create flash frame manager
  const flashManager = new FlashFrameManager(mainWindow);

  // Cleanup on app quit
  app.on('before-quit', () => {
    trayManager.destroy();
  });

  console.log('System tray initialized');

  return trayManager;
}
