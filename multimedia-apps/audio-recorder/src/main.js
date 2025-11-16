const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 開發模式下打開開發者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// 選擇保存路徑
ipcMain.handle('select-save-path', async (event, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存音頻文件',
    defaultPath: defaultName,
    filters: filters || [
      { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'webm'] },
      { name: 'WAV Files', extensions: ['wav'] },
      { name: 'MP3 Files', extensions: ['mp3'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return result.filePath;
});

// 保存音頻文件
ipcMain.handle('save-audio', async (event, buffer, filePath) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving audio:', error);
    return { success: false, error: error.message };
  }
});

// 打開音頻文件
ipcMain.handle('open-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '打開音頻文件',
    filters: [
      { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'webm', 'm4a', 'aac'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  try {
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      data: buffer
    };
  } catch (error) {
    console.error('Error reading audio file:', error);
    return { error: error.message };
  }
});
