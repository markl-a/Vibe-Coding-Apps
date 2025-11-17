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
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Voice Generator - 语音生成器',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 设置应用菜单
  setupMenu();
}

function setupMenu() {
  const { Menu } = require('electron');

  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导出音频',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-export');
          }
        },
        {
          label: '清空文本',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.send('menu-clear');
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
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '语音',
      submenu: [
        {
          label: '预览',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-preview');
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
          label: '刷新音色列表',
          click: () => {
            mainWindow.webContents.send('menu-refresh-voices');
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用说明',
          click: () => {
            mainWindow.webContents.send('menu-help');
          }
        },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 Voice Generator',
              message: 'Voice Generator v1.0.0',
              detail: '专业的文字转语音工具\n\n支持多种音色、参数调节和波形可视化\n\n© 2024 Vibe Coding Apps',
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 保存音频文件
ipcMain.handle('save-audio', async (event, audioData, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存音频文件',
    defaultPath: defaultName || 'voice-output.wav',
    filters: [
      { name: '音频文件', extensions: ['wav', 'mp3', 'ogg'] },
      { name: 'WAV 文件', extensions: ['wav'] },
      { name: 'MP3 文件', extensions: ['mp3'] },
      { name: 'OGG 文件', extensions: ['ogg'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['createDirectory', 'showOverwriteConfirmation']
  });

  if (!result.canceled && result.filePath) {
    try {
      // 将 base64 数据转换为 Buffer
      const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      fs.writeFileSync(result.filePath, buffer);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('保存文件失败:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, canceled: true };
});

// 选择文件
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || '选择文件',
    filters: options.filters || [{ name: '所有文件', extensions: ['*'] }],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, content, filePath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, canceled: true };
});

// 显示消息对话框
ipcMain.handle('show-message', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, {
    type: options.type || 'info',
    title: options.title || '提示',
    message: options.message || '',
    detail: options.detail || '',
    buttons: options.buttons || ['确定']
  });
});

// 应用准备完成
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 激活应用时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  dialog.showErrorBox('错误', `应用发生错误：${error.message}`);
});
