const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#1a1a2e',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Select images
ipcMain.handle('select-images', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ]
  });

  if (result.canceled) {
    return [];
  }

  return result.filePaths;
});

// Select audio file
ipcMain.handle('select-audio', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Save video file
ipcMain.handle('save-video', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'video.mp4',
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'WebM Video', extensions: ['webm'] },
      { name: 'GIF Animation', extensions: ['gif'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePath;
});

// Read file as base64
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const base64 = data.toString('base64');
    const ext = path.extname(filePath).toLowerCase();

    let mimeType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.bmp') mimeType = 'image/bmp';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.wav') mimeType = 'audio/wav';
    else if (ext === '.ogg') mimeType = 'audio/ogg';

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// Write file
ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    // If data is base64, convert it
    if (typeof data === 'string' && data.startsWith('data:')) {
      const base64Data = data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, data);
    }
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

// Show message
ipcMain.handle('show-message', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

// Get app path
ipcMain.handle('get-app-path', async () => {
  return app.getAppPath();
});

// Save project
ipcMain.handle('save-project', async (event, project) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'project.vgp',
    filters: [
      { name: 'Video Generator Project', extensions: ['vgp'] }
    ]
  });

  if (result.canceled) {
    return false;
  }

  try {
    fs.writeFileSync(result.filePath, JSON.stringify(project, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
});

// Open project
ipcMain.handle('open-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Generator Project', extensions: ['vgp'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  try {
    const data = fs.readFileSync(result.filePaths[0], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error opening project:', error);
    return null;
  }
});
