const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 开发模式下打开开发者工具
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

// IPC 处理程序 - 打开视频文件
ipcMain.handle('open-video-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];

    // 获取视频元数据
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          path: filePath,
          name: path.basename(filePath),
          duration: metadata.format.duration,
          width: videoStream ? videoStream.width : 0,
          height: videoStream ? videoStream.height : 0,
          fps: videoStream ? eval(videoStream.r_frame_rate) : 0,
          hasAudio: !!audioStream,
          size: metadata.format.size,
          format: metadata.format.format_name
        });
      });
    });
  }

  return null;
});

// IPC 处理程序 - 打开音频文件
ipcMain.handle('open-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          path: filePath,
          name: path.basename(filePath),
          duration: metadata.format.duration,
          size: metadata.format.size
        });
      });
    });
  }

  return null;
});

// IPC 处理程序 - 导出视频
ipcMain.handle('export-video', async (event, options) => {
  const { defaultPath, filters } = options;

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath || 'output.mp4',
    filters: filters || [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'WebM Video', extensions: ['webm'] },
      { name: 'AVI Video', extensions: ['avi'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }

  return null;
});

// IPC 处理程序 - 处理视频剪辑
ipcMain.handle('process-video', async (event, processOptions) => {
  const {
    inputPath,
    outputPath,
    startTime,
    endTime,
    filters,
    overlay,
    audioPath,
    texts
  } = processOptions;

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // 设置时间范围
    if (startTime !== undefined) {
      command = command.setStartTime(startTime);
    }
    if (endTime !== undefined) {
      command = command.setDuration(endTime - (startTime || 0));
    }

    // 应用滤镜
    const filterArray = [];

    if (filters) {
      if (filters.brightness !== undefined && filters.brightness !== 0) {
        filterArray.push(`eq=brightness=${filters.brightness / 100}`);
      }
      if (filters.contrast !== undefined && filters.contrast !== 0) {
        filterArray.push(`eq=contrast=${1 + filters.contrast / 100}`);
      }
      if (filters.saturation !== undefined && filters.saturation !== 0) {
        filterArray.push(`eq=saturation=${1 + filters.saturation / 100}`);
      }
      if (filters.blur) {
        filterArray.push(`boxblur=${filters.blur}`);
      }
      if (filters.sharpen) {
        filterArray.push(`unsharp=5:5:${filters.sharpen}:5:5:0`);
      }
      if (filters.grayscale) {
        filterArray.push('hue=s=0');
      }
      if (filters.sepia) {
        filterArray.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
      }
      if (filters.vignette) {
        filterArray.push('vignette');
      }
    }

    // 添加文字叠加
    if (texts && texts.length > 0) {
      texts.forEach(text => {
        const escapedText = text.content.replace(/:/g, '\\:').replace(/'/g, "\\'");
        filterArray.push(
          `drawtext=text='${escapedText}':fontsize=${text.fontSize || 24}:` +
          `fontcolor=${text.color || 'white'}:x=${text.x || 10}:y=${text.y || 10}:` +
          `enable='between(t,${text.startTime || 0},${text.endTime || 99999})'`
        );
      });
    }

    if (filterArray.length > 0) {
      command = command.videoFilters(filterArray.join(','));
    }

    // 添加音频
    if (audioPath) {
      command = command.input(audioPath);
    }

    // 设置输出格式
    command = command
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4');

    // 进度回调
    command.on('progress', (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('export-progress', {
          percent: progress.percent || 0,
          currentTime: progress.timemark
        });
      }
    });

    command.on('end', () => {
      resolve({ success: true, outputPath });
    });

    command.on('error', (err) => {
      reject(err);
    });

    command.run();
  });
});

// IPC 处理程序 - 合并视频片段
ipcMain.handle('merge-videos', async (event, options) => {
  const { clips, outputPath } = options;

  return new Promise((resolve, reject) => {
    // 创建临时文件列表
    const tempListPath = path.join(app.getPath('temp'), 'merge_list.txt');
    const fileList = clips.map(clip => `file '${clip.path}'`).join('\n');

    fs.writeFileSync(tempListPath, fileList);

    const command = ffmpeg()
      .input(tempListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath);

    command.on('progress', (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('export-progress', {
          percent: progress.percent || 0
        });
      }
    });

    command.on('end', () => {
      fs.unlinkSync(tempListPath);
      resolve({ success: true, outputPath });
    });

    command.on('error', (err) => {
      if (fs.existsSync(tempListPath)) {
        fs.unlinkSync(tempListPath);
      }
      reject(err);
    });

    command.run();
  });
});

// IPC 处理程序 - 提取视频帧作为缩略图
ipcMain.handle('extract-thumbnail', async (event, options) => {
  const { videoPath, timestamp, outputPath } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '160x90'
      })
      .on('end', () => {
        resolve({ success: true, path: outputPath });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
});

// IPC 处理程序 - 保存项目
ipcMain.handle('save-project', async (event, projectData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'project.vedproj',
    filters: [
      { name: 'Video Editor Project', extensions: ['vedproj'] }
    ]
  });

  if (!result.canceled) {
    fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2));
    return { success: true, path: result.filePath };
  }

  return { success: false };
});

// IPC 处理程序 - 打开项目
ipcMain.handle('open-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Editor Project', extensions: ['vedproj'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const projectData = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
    return { success: true, data: projectData, path: result.filePaths[0] };
  }

  return { success: false };
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
