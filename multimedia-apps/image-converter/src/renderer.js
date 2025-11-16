const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const optionsSection = document.getElementById('optionsSection');
const imagesSection = document.getElementById('imagesSection');
const progressSection = document.getElementById('progressSection');
const imagesGrid = document.getElementById('imagesGrid');
const loadedCount = document.getElementById('loadedCount');
const convertedCount = document.getElementById('convertedCount');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const resizeEnable = document.getElementById('resizeEnable');
const resizeControls = document.getElementById('resizeControls');
const resizeMode = document.getElementById('resizeMode');
const convertBtn = document.getElementById('convertBtn');
const convertAllBtn = document.getElementById('convertAllBtn');
const clearBtn = document.getElementById('clearBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// State
let loadedImages = [];
let selectedFormat = 'png';
let convertedTotal = 0;

// Initialize
init();

function init() {
    setupEventListeners();
    setupDragAndDrop();
}

function setupEventListeners() {
    // File selection
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const quality = this.getAttribute('data-quality');
            qualitySlider.value = quality;
            qualityValue.textContent = quality;
        });
    });

    // Format buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedFormat = this.getAttribute('data-format');
        });
    });

    // Resize controls
    resizeEnable.addEventListener('change', (e) => {
        resizeControls.style.display = e.target.checked ? 'block' : 'none';
    });

    resizeMode.addEventListener('change', (e) => {
        document.getElementById('percentageInputs').style.display = 'none';
        document.getElementById('pixelInputs').style.display = 'none';
        document.getElementById('presetInputs').style.display = 'none';

        switch(e.target.value) {
            case 'percentage':
                document.getElementById('percentageInputs').style.display = 'flex';
                break;
            case 'pixels':
                document.getElementById('pixelInputs').style.display = 'flex';
                break;
            case 'preset':
                document.getElementById('presetInputs').style.display = 'block';
                break;
        }
    });

    // Action buttons
    convertBtn.addEventListener('click', () => convertSelectedImages());
    convertAllBtn.addEventListener('click', () => batchConvertAll());
    clearBtn.addEventListener('click', () => clearAllImages());

    // IPC listeners
    ipcRenderer.on('conversion-progress', (event, progress) => {
        updateProgress(progress.current, progress.total);
        console.log(`Converting ${progress.file}...`);
    });
}

function setupDragAndDrop() {
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

        handleFiles(files);
    });
}

async function handleFiles(files) {
    for (const file of files) {
        const imageData = {
            path: file.path,
            name: file.name,
            size: file.size,
            type: file.type,
            thumbnail: null,
            info: null,
            selected: false
        };

        // Create thumbnail
        const reader = new FileReader();
        reader.onload = (e) => {
            imageData.thumbnail = e.target.result;
            addImageToGrid(imageData);
        };
        reader.readAsDataURL(file);

        // Get image info
        const info = await ipcRenderer.invoke('get-image-info', file.path);
        imageData.info = info;

        loadedImages.push(imageData);
    }

    updateUI();
}

function addImageToGrid(imageData) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.dataset.path = imageData.path;

    card.innerHTML = `
        <div class="image-preview">
            <img src="${imageData.thumbnail}" alt="${imageData.name}">
            <div class="image-overlay">
                <button class="overlay-btn select-btn">✓</button>
                <button class="overlay-btn remove-btn">✕</button>
            </div>
        </div>
        <div class="image-info">
            <div class="image-name" title="${imageData.name}">${imageData.name}</div>
            <div class="image-details">
                ${imageData.info ? `${imageData.info.width}×${imageData.info.height} · ${formatFileSize(imageData.size)}` : 'Loading...'}
            </div>
        </div>
        <div class="conversion-status"></div>
    `;

    // Select button
    card.querySelector('.select-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleImageSelection(imageData.path);
    });

    // Remove button
    card.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage(imageData.path);
    });

    // Card click to toggle selection
    card.addEventListener('click', () => {
        toggleImageSelection(imageData.path);
    });

    imagesGrid.appendChild(card);
}

function toggleImageSelection(imagePath) {
    const image = loadedImages.find(img => img.path === imagePath);
    if (image) {
        image.selected = !image.selected;

        const card = document.querySelector(`[data-path="${imagePath}"]`);
        if (card) {
            card.classList.toggle('selected', image.selected);
        }
    }
}

function removeImage(imagePath) {
    loadedImages = loadedImages.filter(img => img.path !== imagePath);

    const card = document.querySelector(`[data-path="${imagePath}"]`);
    if (card) {
        card.remove();
    }

    updateUI();
}

function clearAllImages() {
    if (confirm('確定要清除所有圖片嗎？')) {
        loadedImages = [];
        imagesGrid.innerHTML = '';
        updateUI();
    }
}

async function convertSelectedImages() {
    const selected = loadedImages.filter(img => img.selected);

    if (selected.length === 0) {
        alert('請先選擇要轉換的圖片！');
        return;
    }

    for (const image of selected) {
        await convertImage(image);
    }
}

async function batchConvertAll() {
    if (loadedImages.length === 0) {
        alert('請先載入圖片！');
        return;
    }

    // Select output directory
    const outputDir = await ipcRenderer.invoke('select-output-directory');
    if (!outputDir) return;

    progressSection.style.display = 'block';

    const options = {
        inputPaths: loadedImages.map(img => img.path),
        outputDir,
        outputFormat: selectedFormat,
        quality: parseInt(qualitySlider.value),
        resize: getResizeOptions(),
        effects: getEffectOptions()
    };

    const result = await ipcRenderer.invoke('batch-convert-images', options);

    progressSection.style.display = 'none';

    if (result.success) {
        convertedTotal += result.results.filter(r => r.success).length;
        updateUI();
        alert(`批次轉換完成！\n成功: ${result.results.filter(r => r.success).length}\n失敗: ${result.results.filter(r => !r.success).length}`);
    } else {
        alert('批次轉換失敗: ' + result.error);
    }
}

async function convertImage(imageData) {
    const card = document.querySelector(`[data-path="${imageData.path}"]`);
    const status = card.querySelector('.conversion-status');

    status.textContent = '轉換中...';
    status.className = 'conversion-status converting';

    const options = {
        inputPath: imageData.path,
        outputFormat: selectedFormat,
        quality: parseInt(qualitySlider.value),
        resize: getResizeOptions(),
        effects: getEffectOptions()
    };

    const result = await ipcRenderer.invoke('convert-image', options);

    if (result.success) {
        status.textContent = '✓ 已轉換';
        status.className = 'conversion-status success';
        convertedTotal++;
        updateUI();
    } else {
        status.textContent = '✕ 失敗';
        status.className = 'conversion-status error';
    }
}

function getResizeOptions() {
    if (!resizeEnable.checked) {
        return { enabled: false };
    }

    const mode = resizeMode.value;
    const options = { enabled: true, mode };

    switch(mode) {
        case 'percentage':
            options.percentage = parseInt(document.getElementById('scalePercent').value);
            break;
        case 'pixels':
            options.width = parseInt(document.getElementById('widthPixels').value);
            options.height = parseInt(document.getElementById('heightPixels').value);
            options.maintainAspect = document.getElementById('maintainAspect').checked;
            break;
        case 'preset':
            options.preset = document.getElementById('presetSize').value;
            break;
    }

    return options;
}

function getEffectOptions() {
    return {
        grayscale: document.getElementById('grayscaleCheck').checked,
        flipH: document.getElementById('flipHCheck').checked,
        flipV: document.getElementById('flipVCheck').checked,
        rotation: parseInt(document.getElementById('rotationSelect').value)
    };
}

function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${current} / ${total}`;
}

function updateUI() {
    loadedCount.textContent = loadedImages.length;
    convertedCount.textContent = convertedTotal;

    if (loadedImages.length > 0) {
        optionsSection.style.display = 'block';
        imagesSection.style.display = 'block';
    } else {
        optionsSection.style.display = 'none';
        imagesSection.style.display = 'none';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
