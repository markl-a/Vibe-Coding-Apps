const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: 'GIF Maker - GIF 動畫製作工具',
        icon: path.join(__dirname, '../icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Create GIF from images
ipcMain.handle('create-gif-from-images', async (event, options) => {
    try {
        const { imagePaths, width, height, delay, loop, colors, effects } = options;

        // Initialize GIF encoder
        const encoder = new GIFEncoder(width, height);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Get output path
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(app.getPath('pictures'), `animation_${Date.now()}.gif`),
            filters: [
                { name: 'GIF Animation', extensions: ['gif'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!filePath) {
            return { success: false, error: 'Cancelled' };
        }

        const writeStream = fs.createWriteStream(filePath);
        encoder.createReadStream().pipe(writeStream);

        encoder.start();
        encoder.setRepeat(loop);
        encoder.setDelay(delay);
        encoder.setQuality(Math.floor((256 - colors) / 256 * 20) + 1);

        // Process each frame
        let frames = imagePaths;

        // Apply effects
        if (effects.reverse) {
            frames = frames.reverse();
        }

        if (effects.boomerang) {
            frames = [...frames, ...frames.slice().reverse()];
        }

        for (let i = 0; i < frames.length; i++) {
            event.sender.send('gif-progress', {
                current: i + 1,
                total: frames.length
            });

            const img = await loadImage(frames[i]);

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Apply effects
            ctx.save();

            if (effects.rotate) {
                ctx.translate(width / 2, height / 2);
                ctx.rotate(Math.PI);
                ctx.translate(-width / 2, -height / 2);
            }

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Apply grayscale
            if (effects.grayscale) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                for (let j = 0; j < data.length; j += 4) {
                    const gray = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
                    data[j] = gray;
                    data[j + 1] = gray;
                    data[j + 2] = gray;
                }
                ctx.putImageData(imageData, 0, 0);
            }

            ctx.restore();

            // Add frame
            encoder.addFrame(ctx);
        }

        encoder.finish();

        return new Promise((resolve) => {
            writeStream.on('finish', () => {
                const stats = fs.statSync(filePath);
                resolve({
                    success: true,
                    path: filePath,
                    size: stats.size
                });
            });
        });
    } catch (error) {
        console.error('GIF creation error:', error);
        return { success: false, error: error.message };
    }
});

// Extract frames from video
ipcMain.handle('extract-video-frames', async (event, options) => {
    try {
        const { videoPath, startTime, endTime, fps, width, height } = options;

        // This would require ffmpeg integration
        // For now, return mock data
        return {
            success: true,
            frames: [],
            message: 'Video frame extraction requires FFmpeg integration'
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Preview GIF
ipcMain.handle('preview-gif', async (event, options) => {
    try {
        const { imagePaths, width, height, delay, effects } = options;

        if (imagePaths.length === 0) {
            return { success: false, error: 'No images' };
        }

        // Create small preview (max 3 frames)
        const previewFrames = imagePaths.slice(0, 3);
        const encoder = new GIFEncoder(width, height);
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const chunks = [];
        encoder.createReadStream().on('data', chunk => chunks.push(chunk));

        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(delay);
        encoder.setQuality(10);

        for (const imgPath of previewFrames) {
            const img = await loadImage(imgPath);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            encoder.addFrame(ctx);
        }

        encoder.finish();

        return new Promise((resolve) => {
            encoder.createReadStream().on('end', () => {
                const buffer = Buffer.concat(chunks);
                const dataUrl = `data:image/gif;base64,${buffer.toString('base64')}`;
                resolve({ success: true, dataUrl });
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get image dimensions
ipcMain.handle('get-image-dimensions', async (event, imagePath) => {
    try {
        const img = await loadImage(imagePath);
        return { width: img.width, height: img.height };
    } catch (error) {
        return null;
    }
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
