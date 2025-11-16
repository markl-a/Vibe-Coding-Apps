const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1a1a2e',
    show: false,
    frame: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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

// IPC: 開啟音樂檔案
ipcMain.handle('open-music-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Audio Files',
        extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
      }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths.map(filePath => ({
    path: filePath,
    name: path.basename(filePath),
    size: fs.statSync(filePath).size
  }));
});

// IPC: 開啟資料夾
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const files = fs.readdirSync(folderPath);
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];

  const audioFiles = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return audioExtensions.includes(ext);
    })
    .map(file => {
      const filePath = path.join(folderPath, file);
      return {
        path: filePath,
        name: file,
        size: fs.statSync(filePath).size
      };
    });

  return audioFiles;
});

// IPC: 儲存播放列表
ipcMain.handle('save-playlist', async (event, playlist) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Playlist', extensions: ['json'] }
    ],
    defaultPath: 'playlist.json'
  });

  if (result.canceled) {
    return { success: false };
  }

  try {
    fs.writeFileSync(result.filePath, JSON.stringify(playlist, null, 2));
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC: 載入播放列表
ipcMain.handle('load-playlist', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Playlist', extensions: ['json'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  try {
    const data = fs.readFileSync(result.filePaths[0], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
});
