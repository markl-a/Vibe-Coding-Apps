const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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
        title: 'Image Converter - 圖片格式轉換工具',
        icon: path.join(__dirname, '../icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Convert single image
ipcMain.handle('convert-image', async (event, options) => {
    try {
        const { inputPath, outputFormat, quality, resize, effects } = options;

        // Load image
        const image = await loadImage(inputPath);

        // Calculate dimensions
        let width = image.width;
        let height = image.height;

        if (resize && resize.enabled) {
            if (resize.mode === 'percentage') {
                const scale = resize.percentage / 100;
                width = Math.round(image.width * scale);
                height = Math.round(image.height * scale);
            } else if (resize.mode === 'pixels') {
                width = resize.width || image.width;
                height = resize.height || image.height;
            } else if (resize.mode === 'preset') {
                [width, height] = resize.preset.split('x').map(Number);
            }
        }

        // Create canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Apply rotation
        if (effects.rotation !== 0) {
            ctx.translate(width / 2, height / 2);
            ctx.rotate((effects.rotation * Math.PI) / 180);
            ctx.translate(-width / 2, -height / 2);
        }

        // Apply flip
        if (effects.flipH || effects.flipV) {
            ctx.scale(effects.flipH ? -1 : 1, effects.flipV ? -1 : 1);
            ctx.translate(
                effects.flipH ? -width : 0,
                effects.flipV ? -height : 0
            );
        }

        // Draw image
        ctx.drawImage(image, 0, 0, width, height);

        // Apply grayscale
        if (effects.grayscale) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // Get output path
        const inputFile = path.parse(inputPath);
        const defaultPath = path.join(
            inputFile.dir,
            `${inputFile.name}_converted.${outputFormat}`
        );

        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath,
            filters: [
                { name: 'Images', extensions: [outputFormat] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!filePath) {
            return { success: false, error: 'Cancelled' };
        }

        // Save image
        const buffer = canvas.toBuffer(`image/${outputFormat}`, {
            quality: quality / 100
        });
        fs.writeFileSync(filePath, buffer);

        return { success: true, path: filePath };
    } catch (error) {
        console.error('Image conversion error:', error);
        return { success: false, error: error.message };
    }
});

// Batch convert images
ipcMain.handle('batch-convert-images', async (event, options) => {
    try {
        const { inputPaths, outputDir, outputFormat, quality, resize, effects } = options;

        const results = [];

        for (let i = 0; i < inputPaths.length; i++) {
            const inputPath = inputPaths[i];

            // Send progress update
            event.sender.send('conversion-progress', {
                current: i + 1,
                total: inputPaths.length,
                file: path.basename(inputPath)
            });

            try {
                // Load image
                const image = await loadImage(inputPath);

                // Calculate dimensions
                let width = image.width;
                let height = image.height;

                if (resize && resize.enabled) {
                    if (resize.mode === 'percentage') {
                        const scale = resize.percentage / 100;
                        width = Math.round(image.width * scale);
                        height = Math.round(image.height * scale);
                    } else if (resize.mode === 'pixels') {
                        width = resize.width || image.width;
                        height = resize.height || image.height;
                    } else if (resize.mode === 'preset') {
                        [width, height] = resize.preset.split('x').map(Number);
                    }
                }

                // Create canvas
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');

                // Apply transformations
                ctx.save();

                if (effects.rotation !== 0) {
                    ctx.translate(width / 2, height / 2);
                    ctx.rotate((effects.rotation * Math.PI) / 180);
                    ctx.translate(-width / 2, -height / 2);
                }

                if (effects.flipH || effects.flipV) {
                    ctx.scale(effects.flipH ? -1 : 1, effects.flipV ? -1 : 1);
                    ctx.translate(
                        effects.flipH ? -width : 0,
                        effects.flipV ? -height : 0
                    );
                }

                // Draw image
                ctx.drawImage(image, 0, 0, width, height);

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

                // Generate output path
                const inputFile = path.parse(inputPath);
                const outputPath = path.join(
                    outputDir,
                    `${inputFile.name}.${outputFormat}`
                );

                // Save image
                const buffer = canvas.toBuffer(`image/${outputFormat}`, {
                    quality: quality / 100
                });
                fs.writeFileSync(outputPath, buffer);

                results.push({ success: true, path: outputPath });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }

        return { success: true, results };
    } catch (error) {
        console.error('Batch conversion error:', error);
        return { success: false, error: error.message };
    }
});

// Select output directory
ipcMain.handle('select-output-directory', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory']
    });

    return filePaths.length > 0 ? filePaths[0] : null;
});

// Get image info
ipcMain.handle('get-image-info', async (event, filePath) => {
    try {
        const image = await loadImage(filePath);
        const stats = fs.statSync(filePath);

        return {
            width: image.width,
            height: image.height,
            size: stats.size,
            format: path.extname(filePath).slice(1).toUpperCase()
        };
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
