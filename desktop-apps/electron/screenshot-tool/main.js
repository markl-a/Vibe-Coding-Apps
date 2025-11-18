const { app, BrowserWindow, ipcMain, globalShortcut, screen, desktopCapturer, clipboard, nativeImage, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const AIHelper = require('../shared/ai-helper');

const store = new Store();

// 初始化 AI Helper (如果有設定 API Key)
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
let editorWindow = null;
let tray = null;

// 預設設定
const defaultConfig = {
  saveFolder: app.getPath('pictures'),
  fileFormat: 'png',
  fileName: 'Screenshot_%Y%m%d_%H%M%S',
  autoCopy: true,
  showNotification: true,
  playSound: false,
  showCursor: false,
  hotkeys: {
    fullscreen: 'CommandOrControl+Shift+A',
    region: 'CommandOrControl+Shift+S',
    window: 'CommandOrControl+Shift+W'
  },
  theme: 'light',
  quality: 100
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  createTray();
  registerShortcuts();

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
      click: () => mainWindow.show()
    },
    {
      label: '全螢幕截圖',
      accelerator: 'CommandOrControl+Shift+A',
      click: () => captureFullScreen()
    },
    {
      label: '區域截圖',
      accelerator: 'CommandOrControl+Shift+S',
      click: () => captureRegion()
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

  tray.setToolTip('Screenshot Tool');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function registerShortcuts() {
  const config = store.get('config', defaultConfig);

  // 註冊全域快捷鍵
  globalShortcut.register(config.hotkeys.fullscreen, () => {
    captureFullScreen();
  });

  globalShortcut.register(config.hotkeys.region, () => {
    captureRegion();
  });

  globalShortcut.register(config.hotkeys.window, () => {
    captureWindow();
  });
}

async function captureFullScreen() {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: screen.getPrimaryDisplay().size
  });

  if (sources.length > 0) {
    const screenshot = sources[0].thumbnail;
    openEditor(screenshot);
  }
}

async function captureRegion() {
  // 簡化實現：顯示選擇視窗
  mainWindow.webContents.send('start-region-capture');
}

async function captureWindow() {
  const sources = await desktopCapturer.getSources({
    types: ['window']
  });

  if (sources.length > 0) {
    const screenshot = sources[0].thumbnail;
    openEditor(screenshot);
  }
}

function openEditor(image) {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  editorWindow = new BrowserWindow({
    width: primaryDisplay.workAreaSize.width,
    height: primaryDisplay.workAreaSize.height,
    fullscreen: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  editorWindow.loadFile('editor.html');

  editorWindow.webContents.on('did-finish-load', () => {
    editorWindow.webContents.send('load-image', image.toDataURL());
  });

  editorWindow.on('closed', () => {
    editorWindow = null;
  });
}

// IPC 處理

ipcMain.handle('capture-fullscreen', async () => {
  await captureFullScreen();
  return { success: true };
});

ipcMain.handle('capture-region', async () => {
  await captureRegion();
  return { success: true };
});

ipcMain.handle('capture-window', async () => {
  await captureWindow();
  return { success: true };
});

ipcMain.handle('save-screenshot', async (event, dataUrl) => {
  const config = store.get('config', defaultConfig);

  // 生成檔案名稱
  const now = new Date();
  let fileName = config.fileName;
  fileName = fileName.replace('%Y', now.getFullYear());
  fileName = fileName.replace('%m', String(now.getMonth() + 1).padStart(2, '0'));
  fileName = fileName.replace('%d', String(now.getDate()).padStart(2, '0'));
  fileName = fileName.replace('%H', String(now.getHours()).padStart(2, '0'));
  fileName = fileName.replace('%M', String(now.getMinutes()).padStart(2, '0'));
  fileName = fileName.replace('%S', String(now.getSeconds()).padStart(2, '0'));

  const filePath = path.join(config.saveFolder, `${fileName}.${config.fileFormat}`);

  // 儲存檔案
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    // 確保目錄存在
    if (!fs.existsSync(config.saveFolder)) {
      fs.mkdirSync(config.saveFolder, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);

    // 複製到剪貼簿
    if (config.autoCopy) {
      const image = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(image);
    }

    // 儲存到歷史記錄
    let history = store.get('history', []);
    history.unshift({
      path: filePath,
      timestamp: now.toISOString(),
      thumbnail: dataUrl
    });
    history = history.slice(0, 20); // 保留最近 20 張
    store.set('history', history);

    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-to-clipboard', async (event, dataUrl) => {
  const image = nativeImage.createFromDataURL(dataUrl);
  clipboard.writeImage(image);
  return { success: true };
});

ipcMain.handle('get-config', async (event, key, defaultValue) => {
  if (key) {
    return store.get(key, defaultValue);
  }
  return store.get('config', defaultConfig);
});

ipcMain.handle('set-config', async (event, key, value) => {
  if (typeof key === 'object') {
    store.set('config', key);
  } else {
    store.set(key, value);
  }
  return { success: true };
});

ipcMain.handle('get-history', async () => {
  return store.get('history', []);
});

ipcMain.handle('clear-history', async () => {
  store.set('history', []);
  return { success: true };
});

// AI 功能處理器

ipcMain.handle('ai-recognize-text', async (event, imageBase64) => {
  if (!aiHelper) {
    return {
      success: false,
      error: '請先設定 OpenAI API Key'
    };
  }

  try {
    const text = await aiHelper.recognizeText(imageBase64);
    return { success: true, result: text };
  } catch (error) {
    console.error('OCR Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-describe-image', async (event, imageBase64) => {
  if (!aiHelper) {
    return {
      success: false,
      error: '請先設定 OpenAI API Key'
    };
  }

  try {
    const description = await aiHelper.describeImage(imageBase64);
    return { success: true, result: description };
  } catch (error) {
    console.error('Image Description Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-translate-text', async (event, text, targetLang) => {
  if (!aiHelper) {
    return {
      success: false,
      error: '請先設定 OpenAI API Key'
    };
  }

  try {
    const translation = await aiHelper.translate(text, targetLang);
    return { success: true, result: translation };
  } catch (error) {
    console.error('Translation Error:', error);
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
