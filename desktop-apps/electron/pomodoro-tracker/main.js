const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 350,
    minHeight: 500,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    frame: true,
    transparent: false
  });

  mainWindow.loadFile('index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 建立系統托盤
  createTray();

  // 視窗關閉時最小化到托盤
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '顯示',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: '開始/暫停',
      click: () => {
        mainWindow.webContents.send('tray-toggle-timer');
      }
    },
    { type: 'separator' },
    {
      label: '設定',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('show-settings');
      }
    },
    {
      label: '結束',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Pomodoro Tracker');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// IPC 處理

ipcMain.handle('show-notification', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, 'assets/icon.png'),
      silent: false
    }).show();
  }
  return { success: true };
});

ipcMain.handle('update-tray', async (event, text) => {
  if (tray) {
    tray.setToolTip(text);
  }
  return { success: true };
});

ipcMain.handle('get-config', async (event, key, defaultValue) => {
  return store.get(key, defaultValue);
});

ipcMain.handle('set-config', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('get-stats', async () => {
  return store.get('stats', {
    totalPomodoros: 0,
    todayPomodoros: 0,
    weekPomodoros: [],
    completedTasks: [],
    achievements: []
  });
});

ipcMain.handle('save-stats', async (event, stats) => {
  store.set('stats', stats);
  return { success: true };
});

ipcMain.handle('get-tasks', async () => {
  return store.get('tasks', []);
});

ipcMain.handle('save-tasks', async (event, tasks) => {
  store.set('tasks', tasks);
  return { success: true };
});

// AI 功能處理器

ipcMain.handle('ai-analyze-priority', async (event, tasks) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const analysis = await aiHelper.analyzePriority(tasks);
    return { success: true, result: analysis };
  } catch (error) {
    console.error('AI Priority Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-suggest-tasks', async (event, context) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const suggestions = await aiHelper.suggestTasks(context);
    return { success: true, result: suggestions };
  } catch (error) {
    console.error('AI Suggest Error:', error);
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

app.on('before-quit', () => {
  app.isQuitting = true;
});
