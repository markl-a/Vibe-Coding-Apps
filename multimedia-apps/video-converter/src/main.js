const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'Video Converter - 視頻轉換工具'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('convert-video', async (event, options) => {
    try {
        const { inputPath, outputFormat, quality, resolution, audio } = options;

        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(
                path.dirname(inputPath),
                `${path.parse(inputPath).name}_converted.${outputFormat}`
            ),
            filters: [
                { name: 'Video', extensions: [outputFormat] }
            ]
        });

        if (!filePath) {
            return { success: false, error: 'Cancelled' };
        }

        // Note: This requires FFmpeg to be installed
        // For demo purposes, we'll just copy the file
        const fs = require('fs');
        fs.copyFileSync(inputPath, filePath);

        return {
            success: true,
            path: filePath,
            message: 'Video conversion requires FFmpeg. File copied instead.'
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-video-info', async (event, filePath) => {
    try {
        const fs = require('fs');
        const stats = fs.statSync(filePath);

        return {
            size: stats.size,
            name: path.basename(filePath)
        };
    } catch (error) {
        return null;
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
