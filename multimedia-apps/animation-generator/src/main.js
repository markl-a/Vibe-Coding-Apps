const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
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

    // 创建菜单
    createMenu();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '新建动画',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('new-animation');
                    }
                },
                {
                    label: '打开预设',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        openPreset();
                    }
                },
                {
                    label: '保存预设',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        savePreset();
                    }
                },
                { type: 'separator' },
                {
                    label: '导出动画',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('export-animation');
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
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: '播放',
            submenu: [
                {
                    label: '播放/暂停',
                    accelerator: 'Space',
                    click: () => {
                        mainWindow.webContents.send('toggle-play');
                    }
                },
                {
                    label: '重置',
                    accelerator: 'R',
                    click: () => {
                        mainWindow.webContents.send('reset-animation');
                    }
                }
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '全屏预览',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: 'separator' },
                { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: '开发者工具', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于 Animation Generator',
                            message: 'Animation Generator v1.0.0',
                            detail: '专业的动画生成器\n\n支持多种动画类型和导出格式\n\n© 2024 Vibe Coding Apps',
                            buttons: ['确定']
                        });
                    }
                },
                {
                    label: '使用文档',
                    click: () => {
                        require('electron').shell.openExternal('https://github.com/vibe-coding-apps');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 保存预设
async function savePreset() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: '保存预设',
        defaultPath: 'animation-preset.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        mainWindow.webContents.send('save-preset', result.filePath);
    }
}

// 打开预设
async function openPreset() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '打开预设',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const presetData = fs.readFileSync(result.filePaths[0], 'utf8');
            mainWindow.webContents.send('load-preset', presetData);
        } catch (error) {
            dialog.showErrorBox('错误', '无法读取预设文件: ' + error.message);
        }
    }
}

// IPC 处理程序

// 保存预设数据
ipcMain.on('save-preset-data', (event, data, filePath) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '成功',
            message: '预设已保存',
            buttons: ['确定']
        });
    } catch (error) {
        dialog.showErrorBox('错误', '无法保存预设文件: ' + error.message);
    }
});

// 保存导出文件
ipcMain.on('save-export', async (event, data, format) => {
    const filters = {
        gif: [{ name: 'GIF Image', extensions: ['gif'] }],
        mp4: [{ name: 'MP4 Video', extensions: ['mp4'] }],
        webm: [{ name: 'WebM Video', extensions: ['webm'] }],
        png: [{ name: 'PNG Sequence', extensions: ['zip'] }],
        webp: [{ name: 'WebP Animation', extensions: ['webp'] }]
    };

    const result = await dialog.showSaveDialog(mainWindow, {
        title: '导出动画',
        defaultPath: `animation.${format}`,
        filters: filters[format] || [{ name: 'All Files', extensions: ['*'] }]
    });

    if (!result.canceled && result.filePath) {
        event.reply('export-save-path', result.filePath);
    }
});

// 写入文件
ipcMain.on('write-file', (event, filePath, data) => {
    try {
        fs.writeFileSync(filePath, data);
        event.reply('file-saved', true);
    } catch (error) {
        console.error('Error saving file:', error);
        event.reply('file-saved', false, error.message);
    }
});

// 显示消息
ipcMain.on('show-message', (event, type, title, message) => {
    dialog.showMessageBox(mainWindow, {
        type: type,
        title: title,
        message: message,
        buttons: ['确定']
    });
});

// 显示错误
ipcMain.on('show-error', (event, title, content) => {
    dialog.showErrorBox(title, content);
});

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
