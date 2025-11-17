const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
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
      contextIsolation: false
    },
    backgroundColor: '#000000',
    show: false,
    title: 'AI Video Player - 視頻播放器'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create application menu
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: '打開視頻',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: '打開文件夾',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            mainWindow.webContents.send('menu-open-folder');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '播放',
      submenu: [
        {
          label: '播放/暫停',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('menu-play-pause');
          }
        },
        {
          label: '停止',
          accelerator: 'CmdOrCtrl+.',
          click: () => {
            mainWindow.webContents.send('menu-stop');
          }
        },
        { type: 'separator' },
        {
          label: '快進 10秒',
          accelerator: 'Right',
          click: () => {
            mainWindow.webContents.send('menu-forward');
          }
        },
        {
          label: '快退 10秒',
          accelerator: 'Left',
          click: () => {
            mainWindow.webContents.send('menu-backward');
          }
        }
      ]
    },
    {
      label: '視圖',
      submenu: [
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          label: '開發者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
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

// IPC: 打開視頻文件
ipcMain.handle('open-video-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg']
      },
      {
        name: 'All Files',
        extensions: ['*']
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

// IPC: 打開文件夾
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const files = fs.readdirSync(folderPath);
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'];

  const videoFiles = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return videoExtensions.includes(ext);
    })
    .map(file => {
      const filePath = path.join(folderPath, file);
      return {
        path: filePath,
        name: file,
        size: fs.statSync(filePath).size
      };
    });

  return videoFiles;
});

// IPC: 載入字幕
ipcMain.handle('open-subtitle-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Subtitle Files',
        extensions: ['srt', 'vtt', 'ass', 'ssa']
      }
    ]
  });

  if (result.canceled) {
    return null;
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf8');
    return {
      path: result.filePaths[0],
      content: content
    };
  } catch (error) {
    return null;
  }
});
