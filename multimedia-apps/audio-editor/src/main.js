const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Audio Editor - 音頻編輯器'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('load-audio-file', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (filePaths.length > 0) {
        const filePath = filePaths[0];
        const buffer = fs.readFileSync(filePath);
        return {
            success: true,
            path: filePath,
            name: path.basename(filePath),
            data: buffer.toString('base64')
        };
    }

    return { success: false };
});

ipcMain.handle('export-audio', async (event, options) => {
    const { audioData, format } = options;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `edited_audio.${format}`,
        filters: [
            { name: 'Audio', extensions: [format] }
        ]
    });

    if (filePath) {
        const buffer = Buffer.from(audioData, 'base64');
        fs.writeFileSync(filePath, buffer);
        return { success: true, path: filePath };
    }

    return { success: false };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
