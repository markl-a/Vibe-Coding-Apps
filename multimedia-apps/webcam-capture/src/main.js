const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
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

// 選擇保存目錄
ipcMain.handle('select-save-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '選擇保存目錄',
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// 保存照片
ipcMain.handle('save-photo', async (event, dataUrl, fileName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存照片',
      defaultPath: fileName,
      filters: [
        { name: 'Images', extensions: ['jpg', 'png'] },
        { name: 'JPEG', extensions: ['jpg'] },
        { name: 'PNG', extensions: ['png'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    // 將 Data URL 轉換為 Buffer
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(result.filePath, buffer);
    return { success: true, path: result.filePath };

  } catch (error) {
    console.error('Error saving photo:', error);
    return { success: false, error: error.message };
  }
});

// 保存視頻
ipcMain.handle('save-video', async (event, buffer, fileName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存視頻',
      defaultPath: fileName,
      filters: [
        { name: 'Video Files', extensions: ['webm', 'mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, Buffer.from(buffer));
    return { success: true, path: result.filePath };

  } catch (error) {
    console.error('Error saving video:', error);
    return { success: false, error: error.message };
  }
});

// 批量導出照片
ipcMain.handle('export-photos', async (event, photos) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '選擇導出目錄',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const exportDir = result.filePaths[0];
    let successCount = 0;

    for (const photo of photos) {
      try {
        const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(exportDir, photo.name);

        fs.writeFileSync(filePath, buffer);
        successCount++;
      } catch (err) {
        console.error(`Failed to export ${photo.name}:`, err);
      }
    }

    return {
      success: true,
      path: exportDir,
      count: successCount,
      total: photos.length
    };

  } catch (error) {
    console.error('Error exporting photos:', error);
    return { success: false, error: error.message };
  }
});
