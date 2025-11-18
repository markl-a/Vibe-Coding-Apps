const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const AIHelper = require('../shared/ai-helper');

const store = new Store();

// 初始化 AI Helper
let aiHelper = null;
try {
  const apiKey = store.get('openai_api_key') || process.env.OPENAI_API_KEY;
  if (apiKey) {
    aiHelper = new AIHelper(apiKey);
  }
} catch (error) {
  console.log('AI Helper 未初始化:', error.message);
}
let mainWindow;
let tray = null;

// 剪貼簿歷史記錄
let clipboardHistory = store.get('clipboardHistory', []);
let previousClipboardText = '';

// 設定
const config = {
  maxHistory: store.get('maxHistory', 100),
  checkInterval: store.get('checkInterval', 1000),
  globalShortcut: store.get('globalShortcut', 'CommandOrControl+Shift+V')
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 建立系統托盤
  createTray();

  // 註冊全域快捷鍵
  registerShortcuts();

  // 開始監控剪貼簿
  startClipboardMonitoring();

  // 視窗關閉時最小化到托盤
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '顯示',
      click: () => mainWindow.show()
    },
    {
      label: '清除歷史記錄',
      click: () => {
        clipboardHistory = [];
        store.set('clipboardHistory', []);
        mainWindow.webContents.send('history-updated', clipboardHistory);
      }
    },
    { type: 'separator' },
    {
      label: '結束',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Clipboard Manager');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function registerShortcuts() {
  // 註冊全域快捷鍵顯示視窗
  globalShortcut.register(config.globalShortcut, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function startClipboardMonitoring() {
  // 定期檢查剪貼簿
  setInterval(() => {
    const currentText = clipboard.readText();

    // 如果剪貼簿內容改變且不為空
    if (currentText && currentText !== previousClipboardText) {
      previousClipboardText = currentText;

      // 檢查是否已存在
      const existingIndex = clipboardHistory.findIndex(item => item.content === currentText);

      if (existingIndex !== -1) {
        // 如果已存在，移除舊的並添加到最前面
        clipboardHistory.splice(existingIndex, 1);
      }

      // 添加新項目到歷史記錄
      const newItem = {
        id: Date.now().toString(),
        content: currentText,
        type: 'text',
        timestamp: new Date().toISOString(),
        favorite: false
      };

      clipboardHistory.unshift(newItem);

      // 限制歷史記錄數量
      if (clipboardHistory.length > config.maxHistory) {
        clipboardHistory = clipboardHistory.slice(0, config.maxHistory);
      }

      // 儲存到本地
      store.set('clipboardHistory', clipboardHistory);

      // 通知渲染程序更新
      if (mainWindow) {
        mainWindow.webContents.send('history-updated', clipboardHistory);
      }
    }
  }, config.checkInterval);
}

// IPC 處理

ipcMain.handle('get-history', async () => {
  return clipboardHistory;
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  clipboard.writeText(text);
  previousClipboardText = text; // 避免重複添加
  return { success: true };
});

ipcMain.handle('delete-item', async (event, id) => {
  clipboardHistory = clipboardHistory.filter(item => item.id !== id);
  store.set('clipboardHistory', clipboardHistory);
  mainWindow.webContents.send('history-updated', clipboardHistory);
  return { success: true };
});

ipcMain.handle('toggle-favorite', async (event, id) => {
  const item = clipboardHistory.find(item => item.id === id);
  if (item) {
    item.favorite = !item.favorite;
    store.set('clipboardHistory', clipboardHistory);
    mainWindow.webContents.send('history-updated', clipboardHistory);
  }
  return { success: true };
});

ipcMain.handle('clear-history', async () => {
  clipboardHistory = [];
  store.set('clipboardHistory', []);
  mainWindow.webContents.send('history-updated', clipboardHistory);
  return { success: true };
});

ipcMain.handle('search-history', async (event, query) => {
  if (!query) {
    return clipboardHistory;
  }
  const filtered = clipboardHistory.filter(item =>
    item.content.toLowerCase().includes(query.toLowerCase())
  );
  return filtered;
});

ipcMain.handle('get-config', async () => {
  return config;
});

ipcMain.handle('set-config', async (event, newConfig) => {
  Object.assign(config, newConfig);
  store.set('maxHistory', config.maxHistory);
  store.set('checkInterval', config.checkInterval);
  store.set('globalShortcut', config.globalShortcut);

  // 重新註冊快捷鍵
  globalShortcut.unregisterAll();
  registerShortcuts();

  return { success: true };
});

// AI 功能處理器

ipcMain.handle('ai-classify', async (event, text) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const category = await aiHelper.classifyText(text, ['工作', '個人', '程式碼', '網址', '其他']);
    return { success: true, result: category };
  } catch (error) {
    console.error('AI Classify Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-summarize', async (event, text) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const summary = await aiHelper.summarizeText(text, 100);
    return { success: true, result: summary };
  } catch (error) {
    console.error('AI Summarize Error:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
