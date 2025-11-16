const { app, BrowserWindow, ipcMain, screen, globalShortcut, dialog, desktopCapturer, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let captureWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        title: 'Screenshot Tool - 專業截圖工具',
        icon: path.join(__dirname, '../icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Register global shortcuts
    registerShortcuts();
}

function registerShortcuts() {
    // Full screen screenshot - Ctrl+Shift+3
    globalShortcut.register('CommandOrControl+Shift+3', () => {
        captureFullScreen();
    });

    // Region screenshot - Ctrl+Shift+4
    globalShortcut.register('CommandOrControl+Shift+4', () => {
        captureRegion();
    });

    // Window screenshot - Ctrl+Shift+5
    globalShortcut.register('CommandOrControl+Shift+5', () => {
        captureWindow();
    });
}

async function captureFullScreen() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: screen.getPrimaryDisplay().size
        });

        if (sources.length > 0) {
            const screenshot = sources[0].thumbnail;
            mainWindow.webContents.send('screenshot-captured', screenshot.toDataURL());
        }
    } catch (error) {
        console.error('Full screen capture failed:', error);
    }
}

async function captureRegion() {
    // Create a transparent overlay window for region selection
    captureWindow = new BrowserWindow({
        fullscreen: true,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    captureWindow.loadFile(path.join(__dirname, 'region-selector.html'));

    // Hide main window temporarily
    mainWindow.hide();
}

async function captureWindow() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['window'],
            thumbnailSize: screen.getPrimaryDisplay().size
        });

        // Show window selection dialog
        mainWindow.webContents.send('show-window-selection', sources.map(s => ({
            id: s.id,
            name: s.name,
            thumbnail: s.thumbnail.toDataURL()
        })));
    } catch (error) {
        console.error('Window capture failed:', error);
    }
}

// IPC Handlers
ipcMain.on('capture-fullscreen', () => {
    captureFullScreen();
});

ipcMain.on('capture-region', () => {
    captureRegion();
});

ipcMain.on('capture-window', () => {
    captureWindow();
});

ipcMain.on('capture-delayed', (event, delay) => {
    setTimeout(() => {
        captureFullScreen();
    }, delay * 1000);
});

ipcMain.on('region-selected', async (event, bounds) => {
    if (captureWindow) {
        captureWindow.close();
        captureWindow = null;
    }

    mainWindow.show();

    // Capture the selected region
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: screen.getPrimaryDisplay().size
        });

        if (sources.length > 0) {
            const fullScreenshot = sources[0].thumbnail;
            const img = nativeImage.createFromDataURL(fullScreenshot.toDataURL());
            const cropped = img.crop(bounds);
            mainWindow.webContents.send('screenshot-captured', cropped.toDataURL());
        }
    } catch (error) {
        console.error('Region capture failed:', error);
    }
});

ipcMain.on('region-cancelled', () => {
    if (captureWindow) {
        captureWindow.close();
        captureWindow = null;
    }
    mainWindow.show();
});

ipcMain.handle('save-screenshot', async (event, dataUrl, options) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(app.getPath('pictures'), `Screenshot_${Date.now()}.${options.format}`),
        filters: [
            { name: 'Images', extensions: [options.format] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (filePath) {
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        return { success: true, path: filePath };
    }

    return { success: false };
});

ipcMain.on('copy-to-clipboard', (event, dataUrl) => {
    const img = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(img);
});

ipcMain.handle('select-save-path', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    return filePaths.length > 0 ? filePaths[0] : null;
});

ipcMain.handle('get-sources', async (event, type) => {
    const sources = await desktopCapturer.getSources({
        types: [type],
        thumbnailSize: { width: 150, height: 150 }
    });

    return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
    }));
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
