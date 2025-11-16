const { ipcRenderer } = require('electron');
const path = require('path');

// DOM Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const imagesMode = document.getElementById('imagesMode');
const videoMode = document.getElementById('videoMode');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const selectImagesBtn = document.getElementById('selectImagesBtn');
const videoDropZone = document.getElementById('videoDropZone');
const videoInput = document.getElementById('videoInput');
const selectVideoBtn = document.getElementById('selectVideoBtn');
const timeline = document.getElementById('timeline');
const timelineSection = document.getElementById('timelineSection');
const videoPreviewSection = document.getElementById('videoPreviewSection');
const settingsSection = document.getElementById('settingsSection');
const previewSection = document.getElementById('previewSection');
const actionPanel = document.getElementById('actionPanel');
const progressPanel = document.getElementById('progressPanel');
const createGifBtn = document.getElementById('createGifBtn');
const previewGifBtn = document.getElementById('previewGifBtn');
const resetBtn = document.getElementById('resetBtn');
const gifPreview = document.getElementById('gifPreview');
const previewInfo = document.getElementById('previewInfo');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const colorsSlider = document.getElementById('colorsSlider');
const colorsValue = document.getElementById('colorsValue');

// State
let currentMode = 'images';
let imageFiles = [];
let videoFile = null;

// Initialize
init();

function init() {
    setupEventListeners();
    setupDragAndDrop();
}

function setupEventListeners() {
    // Mode switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.getAttribute('data-mode');
            switchMode(currentMode);
        });
    });

    // Image selection
    selectImagesBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        handleImageFiles(Array.from(e.target.files));
    });

    // Video selection
    selectVideoBtn.addEventListener('click', () => videoInput.click());
    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleVideoFile(e.target.files[0]);
        }
    });

    // Timeline controls
    document.getElementById('clearTimelineBtn').addEventListener('click', clearTimeline);
    document.getElementById('sortTimelineBtn').addEventListener('click', sortTimeline);

    // Settings
    colorsSlider.addEventListener('input', (e) => {
        colorsValue.textContent = e.target.value;
    });

    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainRatio = document.getElementById('maintainRatio');

    widthInput.addEventListener('input', (e) => {
        if (maintainRatio.checked && imageFiles.length > 0) {
            const ratio = parseInt(widthInput.dataset.originalHeight) / parseInt(widthInput.dataset.originalWidth);
            heightInput.value = Math.round(e.target.value * ratio);
        }
    });

    heightInput.addEventListener('input', (e) => {
        if (maintainRatio.checked && imageFiles.length > 0) {
            const ratio = parseInt(heightInput.dataset.originalWidth) / parseInt(heightInput.dataset.originalHeight);
            widthInput.value = Math.round(e.target.value * ratio);
        }
    });

    // Preset sizes
    document.querySelectorAll('.preset-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const [width, height] = this.getAttribute('data-size').split('x');
            widthInput.value = width;
            heightInput.value = height;
        });
    });

    // Action buttons
    createGifBtn.addEventListener('click', createGif);
    previewGifBtn.addEventListener('click', previewGif);
    resetBtn.addEventListener('click', reset);

    // IPC listeners
    ipcRenderer.on('gif-progress', (event, progress) => {
        updateProgress(progress.current, progress.total);
    });
}

function setupDragAndDrop() {
    // Images drop zone
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        handleImageFiles(files);
    });

    // Video drop zone
    videoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoDropZone.classList.add('drag-over');
    });

    videoDropZone.addEventListener('dragleave', () => {
        videoDropZone.classList.remove('drag-over');
    });

    videoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        videoDropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('video/')
        );

        if (files.length > 0) {
            handleVideoFile(files[0]);
        }
    });
}

function switchMode(mode) {
    if (mode === 'images') {
        imagesMode.style.display = 'block';
        videoMode.style.display = 'none';
    } else {
        imagesMode.style.display = 'none';
        videoMode.style.display = 'block';
    }
    reset();
}

async function handleImageFiles(files) {
    for (const file of files) {
        imageFiles.push(file.path);
        addImageToTimeline(file);

        // Set default dimensions from first image
        if (imageFiles.length === 1) {
            const dims = await ipcRenderer.invoke('get-image-dimensions', file.path);
            if (dims) {
                const widthInput = document.getElementById('widthInput');
                const heightInput = document.getElementById('heightInput');
                widthInput.value = Math.min(dims.width, 480);
                heightInput.value = Math.min(dims.height, 360);
                widthInput.dataset.originalWidth = dims.width;
                widthInput.dataset.originalHeight = dims.height;
                heightInput.dataset.originalWidth = dims.width;
                heightInput.dataset.originalHeight = dims.height;
            }
        }
    }

    updateUI();
}

function addImageToTimeline(file) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.dataset.path = file.path;

    const reader = new FileReader();
    reader.onload = (e) => {
        item.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}">
            <button class="remove-btn">×</button>
        `;

        item.querySelector('.remove-btn').addEventListener('click', (ev) => {
            ev.stopPropagation();
            removeImageFromTimeline(file.path);
        });
    };
    reader.readAsDataURL(file);

    timeline.appendChild(item);
}

function removeImageFromTimeline(filePath) {
    imageFiles = imageFiles.filter(p => p !== filePath);
    const item = timeline.querySelector(`[data-path="${filePath}"]`);
    if (item) item.remove();
    updateUI();
}

function clearTimeline() {
    if (confirm('確定要清除所有圖片嗎？')) {
        imageFiles = [];
        timeline.innerHTML = '';
        updateUI();
    }
}

function sortTimeline() {
    imageFiles.sort();
    timeline.innerHTML = '';
    imageFiles.forEach(filePath => {
        const file = { path: filePath, name: path.basename(filePath) };
        addImageToTimeline(file);
    });
}

function handleVideoFile(file) {
    videoFile = file;
    const videoPreview = document.getElementById('videoPreview');
    videoPreview.src = URL.createObjectURL(file);
    videoPreviewSection.style.display = 'block';
    updateUI();
}

async function createGif() {
    if (currentMode === 'images' && imageFiles.length === 0) {
        alert('請先載入圖片！');
        return;
    }

    progressPanel.style.display = 'block';
    createGifBtn.disabled = true;

    const options = getGifOptions();
    const result = await ipcRenderer.invoke('create-gif-from-images', options);

    progressPanel.style.display = 'none';
    createGifBtn.disabled = false;

    if (result.success) {
        alert(`GIF 製作成功！\n位置: ${result.path}\n大小: ${formatFileSize(result.size)}`);
    } else {
        alert('GIF 製作失敗: ' + result.error);
    }
}

async function previewGif() {
    if (imageFiles.length === 0) {
        alert('請先載入圖片！');
        return;
    }

    const options = getGifOptions();
    const result = await ipcRenderer.invoke('preview-gif', options);

    if (result.success) {
        gifPreview.src = result.dataUrl;
        previewSection.style.display = 'block';
    } else {
        alert('預覽失敗: ' + result.error);
    }
}

function getGifOptions() {
    return {
        imagePaths: imageFiles,
        width: parseInt(document.getElementById('widthInput').value),
        height: parseInt(document.getElementById('heightInput').value),
        delay: parseInt(document.getElementById('delayInput').value),
        loop: parseInt(document.getElementById('loopSelect').value),
        colors: parseInt(colorsSlider.value),
        fps: parseInt(document.getElementById('fpsInput').value),
        effects: {
            reverse: document.getElementById('reverseEffect').checked,
            boomerang: document.getElementById('boomerangEffect').checked,
            grayscale: document.getElementById('grayscaleEffect').checked,
            rotate: document.getElementById('rotateEffect').checked
        }
    };
}

function reset() {
    imageFiles = [];
    videoFile = null;
    timeline.innerHTML = '';
    const videoPreview = document.getElementById('videoPreview');
    videoPreview.src = '';
    updateUI();
}

function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `處理中... ${current} / ${total}`;
}

function updateUI() {
    const hasContent = (currentMode === 'images' && imageFiles.length > 0) ||
                       (currentMode === 'video' && videoFile !== null);

    timelineSection.style.display = (currentMode === 'images' && imageFiles.length > 0) ? 'block' : 'none';
    settingsSection.style.display = hasContent ? 'block' : 'none';
    actionPanel.style.display = hasContent ? 'flex' : 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
