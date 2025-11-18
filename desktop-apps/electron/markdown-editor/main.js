const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');
const AIHelper = require('../shared/ai-helper');

const store = new Store();
let mainWindow;

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

// 建立主視窗
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // 開發模式下開啟 DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 建立選單
  createMenu();
}

// 建立應用選單
function createMenu() {
  const template = [
    {
      label: '檔案',
      submenu: [
        {
          label: '新增檔案',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-file')
        },
        {
          label: '開啟檔案',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-open-file')
        },
        {
          label: '儲存檔案',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-file')
        },
        {
          label: '另存新檔',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-file-as')
        },
        { type: 'separator' },
        {
          label: '匯出 HTML',
          click: () => mainWindow.webContents.send('menu-export-html')
        },
        {
          label: '匯出 PDF',
          click: () => mainWindow.webContents.send('menu-export-pdf')
        },
        { type: 'separator' },
        {
          label: '結束',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '編輯',
      submenu: [
        { role: 'undo', label: '復原' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪下' },
        { role: 'copy', label: '複製' },
        { role: 'paste', label: '貼上' },
        { role: 'selectAll', label: '全選' },
        { type: 'separator' },
        {
          label: '搜尋',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-find')
        },
        {
          label: '取代',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow.webContents.send('menu-replace')
        }
      ]
    },
    {
      label: '檢視',
      submenu: [
        { role: 'reload', label: '重新載入' },
        { role: 'toggleDevTools', label: '開發者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重設縮放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全螢幕' },
        { type: 'separator' },
        {
          label: '切換主題',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-toggle-theme')
        }
      ]
    },
    {
      label: '格式',
      submenu: [
        {
          label: '粗體',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-format-bold')
        },
        {
          label: '斜體',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.send('menu-format-italic')
        },
        {
          label: '刪除線',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow.webContents.send('menu-format-strikethrough')
        },
        { type: 'separator' },
        {
          label: '標題 1',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.webContents.send('menu-format-h1')
        },
        {
          label: '標題 2',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.webContents.send('menu-format-h2')
        },
        {
          label: '標題 3',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.webContents.send('menu-format-h3')
        },
        { type: 'separator' },
        {
          label: '插入連結',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow.webContents.send('menu-format-link')
        },
        {
          label: '插入圖片',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.send('menu-format-image')
        },
        {
          label: '插入程式碼區塊',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow.webContents.send('menu-format-code')
        }
      ]
    },
    {
      label: '說明',
      submenu: [
        {
          label: '關於',
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '關於 Markdown Editor',
              message: 'Markdown Editor v1.0.0',
              detail: '簡潔優雅的 Markdown 編輯器\n\nMIT License\n© 2025 Vibe Coding Apps'
            });
          }
        },
        {
          label: 'Markdown 語法說明',
          click: () => mainWindow.webContents.send('menu-help-markdown')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 處理程序

// 開啟檔案對話框
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');

    // 儲存到最近開啟的檔案
    addToRecentFiles(filePath);

    return { path: filePath, content };
  }

  return null;
});

// 儲存檔案對話框
ipcMain.handle('save-file-dialog', async (event, currentPath) => {
  if (currentPath) {
    // 如果已有路徑,直接儲存
    return currentPath;
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'untitled.md'
  });

  if (!result.canceled && result.filePath) {
    return result.filePath;
  }

  return null;
});

// 儲存檔案
ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    addToRecentFiles(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 讀取檔案
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 匯出 HTML
ipcMain.handle('export-html', async (event, html) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'HTML Files', extensions: ['html'] }
    ],
    defaultPath: 'export.html'
  });

  if (!result.canceled && result.filePath) {
    try {
      await fs.writeFile(result.filePath, html, 'utf-8');
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false };
});

// 匯出 PDF
ipcMain.handle('export-pdf', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ],
    defaultPath: 'export.pdf'
  });

  if (!result.canceled && result.filePath) {
    try {
      const data = await mainWindow.webContents.printToPDF({
        printBackground: true,
        margins: {
          marginType: 'default'
        }
      });
      await fs.writeFile(result.filePath, data);
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false };
});

// 取得設定
ipcMain.handle('get-config', async (event, key, defaultValue) => {
  return store.get(key, defaultValue);
});

// 儲存設定
ipcMain.handle('set-config', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

// 取得最近開啟的檔案
ipcMain.handle('get-recent-files', async () => {
  return store.get('recentFiles', []);
});

// AI 功能處理器

ipcMain.handle('ai-improve-text', async (event, text) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const result = await aiHelper.improveSuggestions(text, 'general');
    return { success: true, result };
  } catch (error) {
    console.error('AI Improve Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-summarize', async (event, text) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const result = await aiHelper.summarizeText(text, 200);
    return { success: true, result };
  } catch (error) {
    console.error('AI Summarize Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-autocomplete', async (event, text, context) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const result = await aiHelper.autocomplete(text, context);
    return { success: true, result };
  } catch (error) {
    console.error('AI Autocomplete Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-translate', async (event, text, targetLang) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const result = await aiHelper.translate(text, targetLang);
    return { success: true, result };
  } catch (error) {
    console.error('AI Translate Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-extract-keywords', async (event, text) => {
  if (!aiHelper) {
    return { success: false, error: '請先設定 OpenAI API Key' };
  }

  try {
    const result = await aiHelper.extractKeywords(text, 5);
    return { success: true, result };
  } catch (error) {
    console.error('AI Keywords Error:', error);
    return { success: false, error: error.message };
  }
});

// 輔助函數
function addToRecentFiles(filePath) {
  let recentFiles = store.get('recentFiles', []);

  // 移除重複項目
  recentFiles = recentFiles.filter(f => f !== filePath);

  // 添加到開頭
  recentFiles.unshift(filePath);

  // 限制最多 10 個
  recentFiles = recentFiles.slice(0, 10);

  store.set('recentFiles', recentFiles);
}

// 應用程式生命週期
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

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
