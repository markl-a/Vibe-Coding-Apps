/**
 * Renderer Process - 渲染进程主逻辑
 * 处理 UI 交互、动画控制和导出功能
 */

const { ipcRenderer } = require('electron');

// 全局变量
let animationEngine;
let isExporting = false;
let exportCancelled = false;

// DOM 元素
const canvas = document.getElementById('animationCanvas');
const playBtn = document.getElementById('playBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const statusText = document.getElementById('statusText');
const frameInfo = document.getElementById('frameInfo');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const timelineSlider = document.getElementById('timelineSlider');
const timelineProgress = document.getElementById('timelineProgress');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const exportModal = document.getElementById('exportModal');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupIPC();
});

function initializeApp() {
    // 初始化动画引擎
    animationEngine = new AnimationEngine(canvas);
    animationEngine.init();
    animationEngine.render();

    // 更新 UI
    updateInfoDisplay();
    updateTimeDisplay();
}

// ==================== 事件监听器 ====================

function setupEventListeners() {
    // 播放控制
    playBtn.addEventListener('click', togglePlay);
    resetBtn.addEventListener('click', resetAnimation);
    exportBtn.addEventListener('click', openExportDialog);

    // 动画类型选择
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.dataset.type;
            selectAnimationType(type);
        });
    });

    // 预设选择
    document.getElementById('presetSelect').addEventListener('change', (e) => {
        loadPreset(e.target.value);
    });

    // 参数控制
    setupParameterListeners();

    // 时间轴
    timelineSlider.addEventListener('input', (e) => {
        const progress = parseFloat(e.target.value) / 100;
        const frame = Math.floor(progress * animationEngine.totalFrames);
        animationEngine.renderFrame(frame);
        updateTimeDisplay();
    });

    // 快捷键
    document.addEventListener('keydown', handleKeyPress);

    // 导出对话框
    document.getElementById('cancelExport').addEventListener('click', cancelExport);

    // 窗口大小变化
    window.addEventListener('resize', handleResize);
}

function setupParameterListeners() {
    // 通用参数
    addSliderListener('fpsSlider', 'fpsValue', (value) => {
        animationEngine.updateSettings({ fps: parseInt(value) });
        updateInfoDisplay();
        document.getElementById('fpsValue').textContent = value;
    });

    addSliderListener('speedSlider', 'speedValue', (value) => {
        animationEngine.updateSettings({ speed: parseFloat(value) });
        document.getElementById('speedValue').textContent = value + 'x';
    });

    addSliderListener('durationSlider', 'durationValue', (value) => {
        animationEngine.updateSettings({ duration: parseFloat(value) });
        updateInfoDisplay();
        updateTimeDisplay();
        document.getElementById('durationValue').textContent = value;
    });

    // 画布大小
    document.getElementById('canvasWidth').addEventListener('change', (e) => {
        animationEngine.updateSettings({ canvasWidth: parseInt(e.target.value) });
        animationEngine.reset();
        updateInfoDisplay();
    });

    document.getElementById('canvasHeight').addEventListener('change', (e) => {
        animationEngine.updateSettings({ canvasHeight: parseInt(e.target.value) });
        animationEngine.reset();
        updateInfoDisplay();
    });

    // 粒子参数
    addSliderListener('particleCount', 'particleCountValue', (value) => {
        animationEngine.updateSettings({ particleCount: parseInt(value) });
        animationEngine.reset();
        document.getElementById('particleCountValue').textContent = value;
    });

    addSliderListener('particleSize', 'particleSizeValue', (value) => {
        animationEngine.updateSettings({ particleSize: parseFloat(value) });
        animationEngine.reset();
        document.getElementById('particleSizeValue').textContent = value;
    });

    document.getElementById('particleColor').addEventListener('change', (e) => {
        animationEngine.updateSettings({ particleColor: e.target.value });
        animationEngine.reset();
    });

    document.getElementById('randomColors').addEventListener('change', (e) => {
        animationEngine.updateSettings({ randomColors: e.target.checked });
        animationEngine.reset();
    });

    // 背景设置
    document.getElementById('bgType').addEventListener('change', (e) => {
        animationEngine.updateSettings({ bgType: e.target.value });
        updateBackgroundControls(e.target.value);
    });

    document.getElementById('bgColor').addEventListener('change', (e) => {
        animationEngine.updateSettings({ bgColor: e.target.value });
    });

    // 导出参数
    addSliderListener('exportQuality', 'qualityValue', (value) => {
        document.getElementById('qualityValue').textContent = value + '%';
    });
}

function addSliderListener(sliderId, valueId, callback) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.addEventListener('input', (e) => {
            callback(e.target.value);
        });
    }
}

function updateBackgroundControls(bgType) {
    const bgColorGroup = document.getElementById('bgColorGroup');
    if (bgType === 'transparent') {
        bgColorGroup.style.display = 'none';
    } else {
        bgColorGroup.style.display = 'block';
    }
}

// ==================== 动画控制 ====================

function selectAnimationType(type) {
    // 更新按钮状态
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });

    // 更新动画类型
    animationEngine.setAnimationType(type);
    animationEngine.render();

    // 更新参数面板
    updateParameterPanel(type);

    statusText.textContent = `已切换到: ${getAnimationTypeName(type)}`;
}

function updateParameterPanel(type) {
    // 隐藏所有动态参数
    document.querySelectorAll('.dynamic-params').forEach(panel => {
        panel.style.display = 'none';
    });

    // 显示对应的参数面板
    const particleParams = document.getElementById('particleParams');
    if (type === 'particles' || type === 'particle-text') {
        particleParams.style.display = 'block';
    }
}

function getAnimationTypeName(type) {
    const names = {
        'particles': '粒子效果',
        'shapes': '形状动画',
        'path': '路径动画',
        'text': '文字动画',
        'wave': '波形动画',
        'particle-text': '粒子文字'
    };
    return names[type] || type;
}

function togglePlay() {
    if (animationEngine.isPlaying) {
        animationEngine.pause();
        playIcon.textContent = '▶';
        playText.textContent = '播放';
        statusText.textContent = '已暂停';
    } else {
        animationEngine.play();
        playIcon.textContent = '⏸';
        playText.textContent = '暂停';
        statusText.textContent = '播放中...';
        updatePlayback();
    }
}

function resetAnimation() {
    animationEngine.reset();
    animationEngine.render();
    timelineSlider.value = 0;
    updateTimeDisplay();
    statusText.textContent = '已重置';
}

function updatePlayback() {
    if (!animationEngine.isPlaying) return;

    const progress = animationEngine.currentFrame / animationEngine.totalFrames;
    timelineSlider.value = progress * 100;
    timelineProgress.style.width = (progress * 100) + '%';

    updateInfoDisplay();
    updateTimeDisplay();

    requestAnimationFrame(updatePlayback);
}

// ==================== 预设管理 ====================

function loadPreset(presetName) {
    if (!presetName) return;

    const presets = {
        fireworks: {
            type: 'particles',
            settings: {
                particleCount: 200,
                particleSize: 3,
                randomColors: true,
                speed: 1.5,
                bgColor: '#0a0a1a'
            }
        },
        rain: {
            type: 'particles',
            settings: {
                particleCount: 300,
                particleSize: 2,
                particleColor: '#6eb5ff',
                speed: 2,
                bgColor: '#2c3e50'
            }
        },
        snow: {
            type: 'particles',
            settings: {
                particleCount: 150,
                particleSize: 4,
                particleColor: '#ffffff',
                speed: 0.5,
                bgColor: '#34495e'
            }
        },
        stars: {
            type: 'particles',
            settings: {
                particleCount: 100,
                particleSize: 2,
                randomColors: false,
                particleColor: '#fffacd',
                speed: 0.3,
                bgColor: '#000033'
            }
        },
        explosion: {
            type: 'particles',
            settings: {
                particleCount: 500,
                particleSize: 3,
                randomColors: true,
                speed: 2.5,
                bgColor: '#1a1a2e'
            }
        },
        wave: {
            type: 'wave',
            settings: {
                waveAmplitude: 60,
                waveFrequency: 3,
                particleColor: '#00d4ff',
                speed: 1,
                bgColor: '#0f0f1e'
            }
        },
        spiral: {
            type: 'path',
            settings: {
                pathType: 'spiral',
                particleColor: '#ff006e',
                speed: 1,
                bgColor: '#1a1a2e'
            }
        },
        morph: {
            type: 'shapes',
            settings: {
                speed: 0.8,
                bgColor: '#16213e'
            }
        },
        typing: {
            type: 'text',
            settings: {
                text: 'ANIMATION',
                fontSize: 72,
                particleColor: '#00ff88',
                speed: 1,
                bgColor: '#0a0a1a'
            }
        },
        galaxy: {
            type: 'particle-text',
            settings: {
                text: 'GALAXY',
                fontSize: 80,
                particleCount: 300,
                randomColors: true,
                speed: 1,
                bgColor: '#000011'
            }
        }
    };

    const preset = presets[presetName];
    if (preset) {
        selectAnimationType(preset.type);
        animationEngine.updateSettings(preset.settings);
        animationEngine.reset();
        updateUIFromSettings(preset.settings);
        statusText.textContent = `已加载预设: ${presetName}`;
    }
}

function updateUIFromSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else if (element.type === 'color') {
                element.value = value;
            } else {
                element.value = value;
            }
        }
    }
    updateInfoDisplay();
}

// ==================== 导出功能 ====================

async function openExportDialog() {
    const format = document.getElementById('exportFormat').value;

    showLoading('准备导出...');
    statusText.textContent = '正在导出...';

    try {
        switch (format) {
            case 'gif':
                await exportGIF();
                break;
            case 'mp4':
                await exportMP4();
                break;
            case 'webm':
                await exportWebM();
                break;
            case 'png':
                await exportPNGSequence();
                break;
            case 'webp':
                await exportWebP();
                break;
        }

        if (!exportCancelled) {
            statusText.textContent = '导出成功!';
        }
    } catch (error) {
        console.error('Export error:', error);
        statusText.textContent = '导出失败';
        ipcRenderer.send('show-error', '导出错误', error.message);
    } finally {
        hideLoading();
        exportCancelled = false;
    }
}

async function exportGIF() {
    return new Promise((resolve, reject) => {
        showExportModal();

        ipcRenderer.send('save-export', null, 'gif');

        ipcRenderer.once('export-save-path', async (event, filePath) => {
            if (!filePath) {
                hideExportModal();
                reject(new Error('未选择保存路径'));
                return;
            }

            try {
                const frames = await captureFrames();
                const gifData = await generateGIF(frames);

                const buffer = Buffer.from(gifData);
                ipcRenderer.send('write-file', filePath, buffer);

                ipcRenderer.once('file-saved', (event, success, error) => {
                    hideExportModal();
                    if (success) {
                        resolve();
                    } else {
                        reject(new Error(error));
                    }
                });
            } catch (error) {
                hideExportModal();
                reject(error);
            }
        });
    });
}

async function exportMP4() {
    return exportVideo('mp4');
}

async function exportWebM() {
    return exportVideo('webm');
}

async function exportVideo(format) {
    return new Promise((resolve, reject) => {
        showExportModal();

        ipcRenderer.send('save-export', null, format);

        ipcRenderer.once('export-save-path', async (event, filePath) => {
            if (!filePath) {
                hideExportModal();
                reject(new Error('未选择保存路径'));
                return;
            }

            try {
                const videoBlob = await captureVideo(format);
                const buffer = Buffer.from(await videoBlob.arrayBuffer());

                ipcRenderer.send('write-file', filePath, buffer);

                ipcRenderer.once('file-saved', (event, success, error) => {
                    hideExportModal();
                    if (success) {
                        resolve();
                    } else {
                        reject(new Error(error));
                    }
                });
            } catch (error) {
                hideExportModal();
                reject(error);
            }
        });
    });
}

async function exportPNGSequence() {
    return new Promise((resolve, reject) => {
        showExportModal();

        ipcRenderer.send('save-export', null, 'png');

        ipcRenderer.once('export-save-path', async (event, filePath) => {
            if (!filePath) {
                hideExportModal();
                reject(new Error('未选择保存路径'));
                return;
            }

            try {
                const frames = await captureFrames();
                // 这里简化处理，实际应该创建 ZIP 文件
                const firstFrame = frames[0];
                const base64Data = firstFrame.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                ipcRenderer.send('write-file', filePath, buffer);

                ipcRenderer.once('file-saved', (event, success, error) => {
                    hideExportModal();
                    if (success) {
                        resolve();
                    } else {
                        reject(new Error(error));
                    }
                });
            } catch (error) {
                hideExportModal();
                reject(error);
            }
        });
    });
}

async function exportWebP() {
    // WebP 导出功能（简化版）
    return exportGIF(); // 暂时使用 GIF 导出
}

async function captureFrames() {
    const frames = [];
    const totalFrames = animationEngine.totalFrames;
    const scale = parseFloat(document.getElementById('exportScale').value);

    // 保存当前状态
    const wasPlaying = animationEngine.isPlaying;
    animationEngine.pause();

    // 保存原始尺寸
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // 设置导出尺寸
    if (scale !== 1) {
        canvas.width = originalWidth * scale;
        canvas.height = originalHeight * scale;
        animationEngine.updateSettings({
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        });
    }

    for (let i = 0; i < totalFrames; i++) {
        if (exportCancelled) break;

        animationEngine.renderFrame(i);
        const frameData = canvas.toDataURL('image/png');
        frames.push(frameData);

        updateExportProgress((i + 1) / totalFrames * 100);
    }

    // 恢复原始尺寸
    if (scale !== 1) {
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        animationEngine.updateSettings({
            canvasWidth: originalWidth,
            canvasHeight: originalHeight
        });
    }

    // 恢复播放状态
    if (wasPlaying) {
        animationEngine.play();
    }

    return frames;
}

async function captureVideo(format) {
    return new Promise((resolve, reject) => {
        const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
        const stream = canvas.captureStream(animationEngine.settings.fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 5000000
        });

        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
        };

        mediaRecorder.onerror = (e) => {
            reject(e.error);
        };

        // 开始录制
        mediaRecorder.start();
        animationEngine.reset();
        animationEngine.play();

        // 录制完成后停止
        const duration = animationEngine.settings.duration * 1000;
        setTimeout(() => {
            mediaRecorder.stop();
            animationEngine.pause();
        }, duration);
    });
}

async function generateGIF(frames) {
    // 这是一个简化版本，实际应该使用 gif.js 库
    // 这里返回第一帧的数据作为示例
    const firstFrame = frames[0];
    const base64Data = firstFrame.replace(/^data:image\/png;base64,/, '');
    return base64Data;
}

function updateExportProgress(percent) {
    const progressBar = document.getElementById('exportProgressBar');
    const progressText = document.getElementById('exportProgress');
    const statusText = document.getElementById('exportStatus');

    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = Math.round(percent) + '%';
    if (statusText) statusText.textContent = `正在导出... ${Math.round(percent)}%`;
}

function cancelExport() {
    exportCancelled = true;
    hideExportModal();
    statusText.textContent = '已取消导出';
}

// ==================== UI 更新 ====================

function updateInfoDisplay() {
    const settings = animationEngine.settings;

    document.getElementById('infoResolution').textContent =
        `${settings.canvasWidth}×${settings.canvasHeight}`;
    document.getElementById('infoFPS').textContent = `${settings.fps} FPS`;
    document.getElementById('infoFrames').textContent = animationEngine.totalFrames;
    document.getElementById('infoCurrentFrame').textContent = animationEngine.currentFrame;

    frameInfo.textContent = `帧: ${animationEngine.currentFrame}/${animationEngine.totalFrames}`;
}

function updateTimeDisplay() {
    const current = (animationEngine.currentFrame / animationEngine.settings.fps).toFixed(1);
    const total = animationEngine.settings.duration.toFixed(1);

    currentTime.textContent = current + 's';
    totalTime.textContent = total + 's';
}

function showLoading(text = '处理中...') {
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = text;
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showExportModal() {
    exportModal.classList.remove('hidden');
    document.getElementById('exportProgress').textContent = '0%';
    document.getElementById('exportProgressBar').style.width = '0%';
}

function hideExportModal() {
    exportModal.classList.add('hidden');
}

// ==================== IPC 通信 ====================

function setupIPC() {
    // 新建动画
    ipcRenderer.on('new-animation', () => {
        resetAnimation();
        document.getElementById('presetSelect').value = '';
    });

    // 导出动画
    ipcRenderer.on('export-animation', () => {
        openExportDialog();
    });

    // 播放/暂停
    ipcRenderer.on('toggle-play', () => {
        togglePlay();
    });

    // 重置
    ipcRenderer.on('reset-animation', () => {
        resetAnimation();
    });

    // 保存预设
    ipcRenderer.on('save-preset', (event, filePath) => {
        const presetData = {
            type: animationEngine.animationType,
            settings: animationEngine.settings
        };
        ipcRenderer.send('save-preset-data', presetData, filePath);
    });

    // 加载预设
    ipcRenderer.on('load-preset', (event, presetData) => {
        try {
            const preset = JSON.parse(presetData);
            selectAnimationType(preset.type);
            animationEngine.updateSettings(preset.settings);
            animationEngine.reset();
            updateUIFromSettings(preset.settings);
            statusText.textContent = '预设已加载';
        } catch (error) {
            ipcRenderer.send('show-error', '错误', '无效的预设文件');
        }
    });
}

// ==================== 快捷键处理 ====================

function handleKeyPress(e) {
    // 避免在输入框中触发
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
    }

    switch (e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            resetAnimation();
            break;
    }
}

// ==================== 窗口调整 ====================

function handleResize() {
    // 可以在这里处理窗口大小变化
}

// ==================== 初始化完成 ====================

console.log('Animation Generator 已加载');
statusText.textContent = '就绪';
