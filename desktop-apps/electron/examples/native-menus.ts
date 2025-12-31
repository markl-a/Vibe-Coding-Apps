/**
 * Electron Native Menus and Keyboard Shortcuts
 *
 * This example demonstrates how to create and manage native application menus,
 * context menus, and keyboard shortcuts in Electron applications.
 *
 * Key Concepts:
 * - Application Menu (Menu Bar)
 * - Context Menus (Right-click menus)
 * - Keyboard Shortcuts (Accelerators)
 * - Dynamic Menu Updates
 * - Platform-specific Menus
 */

import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
  dialog,
  clipboard,
  globalShortcut,
} from 'electron';
import * as path from 'path';

// ============== Application Menu ==============

/**
 * Create the main application menu
 */
export class ApplicationMenu {
  private mainWindow: BrowserWindow;
  private recentFiles: string[] = [];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Build and set the application menu
   */
  buildMenu(): Menu {
    const template: MenuItemConstructorOptions[] = [
      // File Menu
      {
        label: 'File',
        submenu: [
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-new-file');
            },
          },
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => {
              this.createNewWindow();
            },
          },
          { type: 'separator' },
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              await this.openFile();
            },
          },
          {
            label: 'Open Recent',
            submenu: this.buildRecentFilesMenu(),
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow.webContents.send('menu-save');
            },
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: async () => {
              await this.saveFileAs();
            },
          },
          { type: 'separator' },
          {
            label: 'Export',
            submenu: [
              {
                label: 'Export as PDF',
                click: () => {
                  this.mainWindow.webContents.send('menu-export-pdf');
                },
              },
              {
                label: 'Export as HTML',
                click: () => {
                  this.mainWindow.webContents.send('menu-export-html');
                },
              },
              {
                label: 'Export as Markdown',
                click: () => {
                  this.mainWindow.webContents.send('menu-export-markdown');
                },
              },
            ],
          },
          { type: 'separator' },
          {
            label: 'Close Window',
            accelerator: 'CmdOrCtrl+W',
            role: 'close',
          },
          ...(process.platform !== 'darwin'
            ? [
                { type: 'separator' as const },
                {
                  label: 'Exit',
                  accelerator: 'Alt+F4',
                  role: 'quit' as const,
                },
              ]
            : []),
        ],
      },

      // Edit Menu
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          },
          {
            label: 'Redo',
            accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y',
            role: 'redo',
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll',
          },
          { type: 'separator' },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: () => {
              this.mainWindow.webContents.send('menu-find');
            },
          },
          {
            label: 'Replace',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              this.mainWindow.webContents.send('menu-replace');
            },
          },
        ],
      },

      // View Menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              this.mainWindow.webContents.reloadIgnoringCache();
            },
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            },
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            role: 'resetZoom',
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            role: 'zoomIn',
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            role: 'zoomOut',
          },
          { type: 'separator' },
          {
            label: 'Toggle Full Screen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => {
              this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
            },
          },
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+B',
            click: () => {
              this.mainWindow.webContents.send('menu-toggle-sidebar');
            },
          },
        ],
      },

      // Window Menu
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize',
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close',
          },
          { type: 'separator' },
          {
            label: 'Always on Top',
            type: 'checkbox',
            checked: false,
            click: (menuItem) => {
              this.mainWindow.setAlwaysOnTop(menuItem.checked);
            },
          },
          { type: 'separator' },
          {
            label: 'Bring All to Front',
            role: 'front',
          },
        ],
      },

      // Help Menu
      {
        label: 'Help',
        role: 'help',
        submenu: [
          {
            label: 'Documentation',
            click: async () => {
              await shell.openExternal('https://docs.example.com');
            },
          },
          {
            label: 'Search Issues',
            click: async () => {
              await shell.openExternal('https://github.com/example/issues');
            },
          },
          { type: 'separator' },
          {
            label: 'View License',
            click: () => {
              this.showLicense();
            },
          },
          { type: 'separator' },
          {
            label: 'Check for Updates...',
            click: () => {
              this.checkForUpdates();
            },
          },
          ...(process.platform !== 'darwin'
            ? [
                { type: 'separator' as const },
                {
                  label: 'About',
                  click: () => {
                    this.showAbout();
                  },
                },
              ]
            : []),
        ],
      },
    ];

    // macOS specific menu items
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.name,
        submenu: [
          {
            label: `About ${app.name}`,
            click: () => {
              this.showAbout();
            },
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'Cmd+,',
            click: () => {
              this.mainWindow.webContents.send('menu-preferences');
            },
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
          },
          { type: 'separator' },
          {
            label: `Hide ${app.name}`,
            accelerator: 'Cmd+H',
            role: 'hide',
          },
          {
            label: 'Hide Others',
            accelerator: 'Cmd+Alt+H',
            role: 'hideOthers',
          },
          {
            label: 'Show All',
            role: 'unhide',
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Cmd+Q',
            role: 'quit',
          },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  /**
   * Build recent files submenu
   */
  private buildRecentFilesMenu(): MenuItemConstructorOptions[] {
    if (this.recentFiles.length === 0) {
      return [
        {
          label: 'No Recent Files',
          enabled: false,
        },
      ];
    }

    const recentItems = this.recentFiles.map((filePath) => ({
      label: path.basename(filePath),
      click: () => {
        this.mainWindow.webContents.send('menu-open-recent', filePath);
      },
    }));

    return [
      ...recentItems,
      { type: 'separator' as const },
      {
        label: 'Clear Recent',
        click: () => {
          this.clearRecentFiles();
        },
      },
    ];
  }

  /**
   * Add file to recent files list
   */
  addRecentFile(filePath: string): void {
    this.recentFiles = [filePath, ...this.recentFiles.filter((f) => f !== filePath)].slice(
      0,
      10
    );
    this.buildMenu(); // Rebuild menu to update recent files
  }

  /**
   * Clear recent files
   */
  private clearRecentFiles(): void {
    this.recentFiles = [];
    this.buildMenu();
  }

  /**
   * Open file dialog
   */
  private async openFile(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      this.addRecentFile(filePath);
      this.mainWindow.webContents.send('menu-open-file', filePath);
    }
  }

  /**
   * Save file as dialog
   */
  private async saveFileAs(): Promise<void> {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      this.mainWindow.webContents.send('menu-save-as', result.filePath);
    }
  }

  /**
   * Create new window
   */
  private createNewWindow(): void {
    const newWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    newWindow.loadURL('http://localhost:3000');
  }

  /**
   * Show about dialog
   */
  private showAbout(): void {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: `About ${app.name}`,
      message: app.name,
      detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode: ${process.versions.node}`,
    });
  }

  /**
   * Show license
   */
  private showLicense(): void {
    this.mainWindow.webContents.send('menu-show-license');
  }

  /**
   * Check for updates
   */
  private checkForUpdates(): void {
    this.mainWindow.webContents.send('menu-check-updates');
  }
}

// ============== Context Menus ==============

/**
 * Create context menus (right-click menus)
 */
export class ContextMenuManager {
  /**
   * Show text editor context menu
   */
  static showEditorContextMenu(window: BrowserWindow, params: Electron.ContextMenuParams): void {
    const template: MenuItemConstructorOptions[] = [];

    // Add cut, copy, paste for editable content
    if (params.isEditable) {
      template.push(
        {
          label: 'Undo',
          role: 'undo',
          enabled: params.editFlags.canUndo,
        },
        {
          label: 'Redo',
          role: 'redo',
          enabled: params.editFlags.canRedo,
        },
        { type: 'separator' },
        {
          label: 'Cut',
          role: 'cut',
          enabled: params.editFlags.canCut,
        },
        {
          label: 'Copy',
          role: 'copy',
          enabled: params.editFlags.canCopy,
        },
        {
          label: 'Paste',
          role: 'paste',
          enabled: params.editFlags.canPaste,
        },
        {
          label: 'Select All',
          role: 'selectAll',
          enabled: params.editFlags.canSelectAll,
        }
      );
    }

    // Add copy for selected text
    if (params.selectionText) {
      template.push({
        label: 'Copy',
        role: 'copy',
      });
    }

    // Add link-specific options
    if (params.linkURL) {
      template.push(
        { type: 'separator' },
        {
          label: 'Open Link',
          click: () => {
            shell.openExternal(params.linkURL);
          },
        },
        {
          label: 'Copy Link',
          click: () => {
            clipboard.writeText(params.linkURL);
          },
        }
      );
    }

    // Add image-specific options
    if (params.mediaType === 'image') {
      template.push(
        { type: 'separator' },
        {
          label: 'Save Image As...',
          click: async () => {
            const result = await dialog.showSaveDialog(window, {
              defaultPath: path.basename(params.srcURL),
            });

            if (!result.canceled && result.filePath) {
              window.webContents.downloadURL(params.srcURL);
            }
          },
        },
        {
          label: 'Copy Image',
          click: () => {
            window.webContents.copyImageAt(params.x, params.y);
          },
        },
        {
          label: 'Copy Image URL',
          click: () => {
            clipboard.writeText(params.srcURL);
          },
        }
      );
    }

    // Add development tools
    if (process.env.NODE_ENV === 'development') {
      template.push(
        { type: 'separator' },
        {
          label: 'Inspect Element',
          click: () => {
            window.webContents.inspectElement(params.x, params.y);
          },
        }
      );
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window });
  }

  /**
   * Show file/folder context menu
   */
  static showFileContextMenu(
    window: BrowserWindow,
    filePath: string,
    isDirectory: boolean
  ): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: isDirectory ? 'Open Folder' : 'Open File',
        click: () => {
          window.webContents.send('context-open-file', filePath);
        },
      },
      { type: 'separator' },
      {
        label: 'Reveal in Finder',
        click: () => {
          shell.showItemInFolder(filePath);
        },
      },
      { type: 'separator' },
      {
        label: 'Rename',
        click: () => {
          window.webContents.send('context-rename-file', filePath);
        },
      },
      {
        label: 'Delete',
        click: async () => {
          const result = await dialog.showMessageBox(window, {
            type: 'warning',
            message: 'Are you sure you want to delete this item?',
            detail: filePath,
            buttons: ['Cancel', 'Delete'],
            defaultId: 0,
            cancelId: 0,
          });

          if (result.response === 1) {
            window.webContents.send('context-delete-file', filePath);
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Copy Path',
        click: () => {
          clipboard.writeText(filePath);
        },
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window });
  }

  /**
   * Show custom context menu
   */
  static showCustomMenu(window: BrowserWindow, items: MenuItemConstructorOptions[]): void {
    const menu = Menu.buildFromTemplate(items);
    menu.popup({ window });
  }
}

// ============== Keyboard Shortcuts ==============

/**
 * Register global keyboard shortcuts
 */
export class KeyboardShortcutManager {
  private registeredShortcuts: Map<string, () => void> = new Map();

  /**
   * Register a global shortcut
   */
  registerShortcut(accelerator: string, callback: () => void): boolean {
    if (this.registeredShortcuts.has(accelerator)) {
      console.warn(`Shortcut ${accelerator} is already registered`);
      return false;
    }

    const success = globalShortcut.register(accelerator, callback);

    if (success) {
      this.registeredShortcuts.set(accelerator, callback);
      console.log(`Registered global shortcut: ${accelerator}`);
    } else {
      console.error(`Failed to register shortcut: ${accelerator}`);
    }

    return success;
  }

  /**
   * Unregister a global shortcut
   */
  unregisterShortcut(accelerator: string): void {
    globalShortcut.unregister(accelerator);
    this.registeredShortcuts.delete(accelerator);
    console.log(`Unregistered global shortcut: ${accelerator}`);
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log('Unregistered all global shortcuts');
  }

  /**
   * Check if shortcut is registered
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Setup common global shortcuts
   */
  setupCommonShortcuts(mainWindow: BrowserWindow): void {
    // Show/hide app window
    this.registerShortcut('CommandOrControl+Shift+Space', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });

    // Screenshot shortcut
    this.registerShortcut('CommandOrControl+Shift+5', () => {
      mainWindow.webContents.send('take-screenshot');
    });

    // Quick note shortcut
    this.registerShortcut('CommandOrControl+Shift+N', () => {
      mainWindow.webContents.send('quick-note');
    });
  }
}

// ============== Initialize Menus ==============

export function initializeMenus(mainWindow: BrowserWindow): void {
  // Setup application menu
  const appMenu = new ApplicationMenu(mainWindow);
  appMenu.buildMenu();

  // Setup context menu on right-click
  mainWindow.webContents.on('context-menu', (event, params) => {
    ContextMenuManager.showEditorContextMenu(mainWindow, params);
  });

  // Setup global shortcuts
  const shortcutManager = new KeyboardShortcutManager();
  shortcutManager.setupCommonShortcuts(mainWindow);

  // Clean up shortcuts when app quits
  app.on('will-quit', () => {
    shortcutManager.unregisterAll();
  });

  console.log('Menus and shortcuts initialized');
}
