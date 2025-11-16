const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#1e1e1e',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 視窗準備好後顯示,避免閃爍
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 開發模式下開啟 DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 應用啟動
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有視窗關閉時退出 (macOS 除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 處理器: 開啟圖片對話框
ipcMain.handle('open-image-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
      }
    ]
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  const imageData = {
    path: filePath,
    name: path.basename(filePath),
    dir: path.dirname(filePath)
  };

  // 讀取同資料夾的所有圖片
  const files = fs.readdirSync(imageData.dir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

  imageData.siblings = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    })
    .map(file => path.join(imageData.dir, file));

  return imageData;
});

// IPC 處理器: 儲存圖片
ipcMain.handle('save-image-dialog', async (event, imageDataUrl) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'edited-image.png'
  });

  if (result.canceled) {
    return { success: false };
  }

  try {
    // 移除 data URL 前綴
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(result.filePath, buffer);

    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Save image error:', error);
    return { success: false, error: error.message };
  }
});

// IPC 處理器: 讀取圖片資訊
ipcMain.handle('get-image-info', async (event, imagePath) => {
  try {
    const stats = fs.statSync(imagePath);
    const data = fs.readFileSync(imagePath);

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      dataUrl: `data:image/${path.extname(imagePath).slice(1)};base64,${data.toString('base64')}`
    };
  } catch (error) {
    console.error('Get image info error:', error);
    return null;
  }
});
