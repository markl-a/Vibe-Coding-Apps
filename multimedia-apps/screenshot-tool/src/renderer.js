const { ipcRenderer } = require('electron');
const path = require('path');

// DOM Elements
const fullScreenBtn = document.getElementById('fullScreenBtn');
const windowBtn = document.getElementById('windowBtn');
const regionBtn = document.getElementById('regionBtn');
const delayBtn = document.getElementById('delayBtn');
const statusText = document.getElementById('statusText');
const previewCanvas = document.getElementById('previewCanvas');
const previewContainer = document.getElementById('previewContainer');
const annotationTools = document.getElementById('annotationTools');
const actionButtons = document.getElementById('actionButtons');
const gallery = document.getElementById('gallery');
const formatSelect = document.getElementById('formatSelect');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const cursorCheck = document.getElementById('cursorCheck');
const soundCheck = document.getElementById('soundCheck');
const clipboardCheck = document.getElementById('clipboardCheck');
const saveBtn = document.getElementById('saveBtn');
const copyBtn = document.getElementById('copyBtn');
const newBtn = document.getElementById('newBtn');
const savePath = document.getElementById('savePath');
const browseBtn = document.getElementById('browseBtn');

// Annotation Tools
const arrowTool = document.getElementById('arrowTool');
const rectTool = document.getElementById('rectTool');
const textTool = document.getElementById('textTool');
const penTool = document.getElementById('penTool');
const blurTool = document.getElementById('blurTool');
const colorPicker = document.getElementById('colorPicker');
const undoTool = document.getElementById('undoTool');
const clearTool = document.getElementById('clearTool');

// State
let currentScreenshot = null;
let screenshots = [];
let annotationHistory = [];
let currentTool = null;
let isDrawing = false;
let startX, startY;
let ctx = previewCanvas.getContext('2d');

// Initialize
init();

function init() {
    setupEventListeners();
    loadSettings();
    loadScreenshots();
    updateStatus('就緒');
}

function setupEventListeners() {
    // Capture buttons
    fullScreenBtn.addEventListener('click', () => captureFullScreen());
    windowBtn.addEventListener('click', () => captureWindow());
    regionBtn.addEventListener('click', () => captureRegion());
    delayBtn.addEventListener('click', () => captureDelayed());

    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Action buttons
    saveBtn.addEventListener('click', () => saveScreenshot());
    copyBtn.addEventListener('click', () => copyToClipboard());
    newBtn.addEventListener('click', () => resetCapture());

    // Browse button
    browseBtn.addEventListener('click', async () => {
        const path = await ipcRenderer.invoke('select-save-path');
        if (path) {
            savePath.value = path;
            saveSettings();
        }
    });

    // Annotation tools
    arrowTool.addEventListener('click', () => selectTool('arrow'));
    rectTool.addEventListener('click', () => selectTool('rect'));
    textTool.addEventListener('click', () => selectTool('text'));
    penTool.addEventListener('click', () => selectTool('pen'));
    blurTool.addEventListener('click', () => selectTool('blur'));
    undoTool.addEventListener('click', () => undo());
    clearTool.addEventListener('click', () => clearAnnotations());

    // Canvas drawing
    previewCanvas.addEventListener('mousedown', handleMouseDown);
    previewCanvas.addEventListener('mousemove', handleMouseMove);
    previewCanvas.addEventListener('mouseup', handleMouseUp);

    // IPC listeners
    ipcRenderer.on('screenshot-captured', (event, dataUrl) => {
        handleScreenshotCaptured(dataUrl);
    });

    ipcRenderer.on('show-window-selection', (event, windows) => {
        showWindowSelection(windows);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's' && currentScreenshot) {
            e.preventDefault();
            saveScreenshot();
        }
        if (e.ctrlKey && e.key === 'c' && currentScreenshot) {
            e.preventDefault();
            copyToClipboard();
        }
        if (e.key === 'Escape') {
            resetCapture();
        }
    });
}

function captureFullScreen() {
    updateStatus('正在截取全螢幕...');
    ipcRenderer.send('capture-fullscreen');
    playSound();
}

function captureWindow() {
    updateStatus('選擇要截取的視窗...');
    ipcRenderer.send('capture-window');
}

function captureRegion() {
    updateStatus('選擇要截取的區域...');
    ipcRenderer.send('capture-region');
}

function captureDelayed() {
    const delay = 5;
    updateStatus(`延遲 ${delay} 秒後截圖...`);

    let countdown = delay;
    const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            updateStatus(`${countdown} 秒後截圖...`);
        } else {
            clearInterval(interval);
            updateStatus('正在截圖...');
        }
    }, 1000);

    ipcRenderer.send('capture-delayed', delay);
    playSound();
}

function handleScreenshotCaptured(dataUrl) {
    currentScreenshot = dataUrl;

    // Load image
    const img = new Image();
    img.onload = () => {
        // Set canvas size
        previewCanvas.width = Math.min(img.width, 1000);
        previewCanvas.height = Math.min(img.height, 1000 * img.height / img.width);

        // Draw image
        ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);

        // Show canvas and hide placeholder
        previewCanvas.style.display = 'block';
        document.querySelector('.preview-placeholder').style.display = 'none';

        // Show tools and buttons
        annotationTools.style.display = 'flex';
        actionButtons.style.display = 'flex';

        updateStatus('截圖完成！');

        // Auto copy to clipboard if enabled
        if (clipboardCheck.checked) {
            copyToClipboard();
        }

        // Add to gallery
        addToGallery(dataUrl);
    };
    img.src = dataUrl;
}

function selectTool(tool) {
    currentTool = tool;

    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    switch(tool) {
        case 'arrow': arrowTool.classList.add('active'); break;
        case 'rect': rectTool.classList.add('active'); break;
        case 'text': textTool.classList.add('active'); break;
        case 'pen': penTool.classList.add('active'); break;
        case 'blur': blurTool.classList.add('active'); break;
    }

    previewCanvas.style.cursor = 'crosshair';
}

function handleMouseDown(e) {
    if (!currentTool) return;

    isDrawing = true;
    const rect = previewCanvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    // Save state for undo
    annotationHistory.push(ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height));
}

function handleMouseMove(e) {
    if (!isDrawing || !currentTool) return;

    const rect = previewCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = 3;

    if (currentTool === 'pen') {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function handleMouseUp(e) {
    if (!isDrawing || !currentTool) return;

    isDrawing = false;
    const rect = previewCanvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = colorPicker.value;
    ctx.lineWidth = 3;

    switch(currentTool) {
        case 'rect':
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            break;
        case 'arrow':
            drawArrow(startX, startY, endX, endY);
            break;
        case 'text':
            const text = prompt('輸入文字：');
            if (text) {
                ctx.font = '24px Arial';
                ctx.fillText(text, startX, startY);
            }
            break;
        case 'blur':
            applyBlur(startX, startY, endX, endY);
            break;
    }

    ctx.beginPath();
}

function drawArrow(fromX, fromY, toX, toY) {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function applyBlur(x1, y1, x2, y2) {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);

    const imageData = ctx.getImageData(x, y, width, height);
    const blurred = gaussianBlur(imageData, 10);
    ctx.putImageData(blurred, x, y);
}

function gaussianBlur(imageData, radius) {
    // Simple box blur approximation
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = Math.floor(pixels[i] * 0.7);
        pixels[i + 1] = Math.floor(pixels[i + 1] * 0.7);
        pixels[i + 2] = Math.floor(pixels[i + 2] * 0.7);
    }

    return imageData;
}

function undo() {
    if (annotationHistory.length > 0) {
        const previousState = annotationHistory.pop();
        ctx.putImageData(previousState, 0, 0);
    }
}

function clearAnnotations() {
    if (confirm('確定要清除所有標註嗎？')) {
        annotationHistory = [];
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
        };
        img.src = currentScreenshot;
    }
}

async function saveScreenshot() {
    if (!currentScreenshot) return;

    const dataUrl = previewCanvas.toDataURL(`image/${formatSelect.value}`, qualitySlider.value / 100);
    const result = await ipcRenderer.invoke('save-screenshot', dataUrl, {
        format: formatSelect.value
    });

    if (result.success) {
        updateStatus(`已儲存至：${result.path}`);
        playSound();
    }
}

function copyToClipboard() {
    if (!currentScreenshot) return;

    const dataUrl = previewCanvas.toDataURL('image/png');
    ipcRenderer.send('copy-to-clipboard', dataUrl);
    updateStatus('已複製到剪貼簿！');
}

function resetCapture() {
    currentScreenshot = null;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCanvas.style.display = 'none';
    document.querySelector('.preview-placeholder').style.display = 'block';
    annotationTools.style.display = 'none';
    actionButtons.style.display = 'none';
    annotationHistory = [];
    currentTool = null;
    updateStatus('就緒');
}

function addToGallery(dataUrl) {
    const galleryEmpty = gallery.querySelector('.gallery-empty');
    if (galleryEmpty) {
        galleryEmpty.remove();
    }

    const item = document.createElement('div');
    item.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.addEventListener('click', () => {
        handleScreenshotCaptured(dataUrl);
    });

    const time = document.createElement('div');
    time.className = 'gallery-time';
    time.textContent = new Date().toLocaleTimeString('zh-TW');

    item.appendChild(img);
    item.appendChild(time);
    gallery.insertBefore(item, gallery.firstChild);

    screenshots.unshift(dataUrl);

    // Keep only last 10 screenshots
    if (screenshots.length > 10) {
        screenshots = screenshots.slice(0, 10);
        const items = gallery.querySelectorAll('.gallery-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }

    saveScreenshots();
}

function showWindowSelection(windows) {
    // Create a modal to show window thumbnails
    const modal = document.createElement('div');
    modal.className = 'window-selection-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>選擇視窗</h3>
            <div class="window-grid">
                ${windows.map((w, i) => `
                    <div class="window-item" data-id="${w.id}">
                        <img src="${w.thumbnail}" alt="${w.name}">
                        <p>${w.name}</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">取消</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle window selection
    modal.querySelectorAll('.window-item').forEach(item => {
        item.addEventListener('click', function() {
            const windowId = this.getAttribute('data-id');
            const selectedWindow = windows.find(w => w.id === windowId);
            if (selectedWindow) {
                handleScreenshotCaptured(selectedWindow.thumbnail);
            }
            modal.remove();
        });
    });
}

function playSound() {
    if (soundCheck.checked) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }
}

function updateStatus(text) {
    statusText.textContent = text;
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('screenshot-settings') || '{}');
    savePath.value = settings.savePath || '';
    formatSelect.value = settings.format || 'png';
    qualitySlider.value = settings.quality || 90;
    qualityValue.textContent = qualitySlider.value;
}

function saveSettings() {
    const settings = {
        savePath: savePath.value,
        format: formatSelect.value,
        quality: qualitySlider.value
    };
    localStorage.setItem('screenshot-settings', JSON.stringify(settings));
}

function loadScreenshots() {
    const saved = JSON.parse(localStorage.getItem('screenshots') || '[]');
    saved.forEach(dataUrl => addToGallery(dataUrl));
}

function saveScreenshots() {
    localStorage.setItem('screenshots', JSON.stringify(screenshots));
}

// Auto-save settings on change
formatSelect.addEventListener('change', saveSettings);
qualitySlider.addEventListener('change', saveSettings);
