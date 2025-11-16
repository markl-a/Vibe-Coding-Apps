const { ipcRenderer } = require('electron');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const settingsSection = document.getElementById('settingsSection');
const progressSection = document.getElementById('progressSection');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const convertCount = document.getElementById('convertCount');

let videoFiles = [];
let totalConverted = 0;

selectFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    handleFiles(files);
});

async function handleFiles(files) {
    for (const file of files) {
        videoFiles.push(file.path);
        addFileToList(file);
    }
    updateUI();
}

function addFileToList(file) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="remove-btn" data-path="${file.path}">×</button>
    `;

    item.querySelector('.remove-btn').addEventListener('click', function() {
        const filePath = this.getAttribute('data-path');
        videoFiles = videoFiles.filter(p => p !== filePath);
        item.remove();
        updateUI();
    });

    filesList.appendChild(item);
}

convertBtn.addEventListener('click', async () => {
    if (videoFiles.length === 0) return;

    progressSection.style.display = 'block';
    convertBtn.disabled = true;

    for (let i = 0; i < videoFiles.length; i++) {
        const progress = ((i + 1) / videoFiles.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = Math.round(progress) + '%';

        const result = await ipcRenderer.invoke('convert-video', {
            inputPath: videoFiles[i],
            outputFormat: document.getElementById('formatSelect').value,
            quality: document.getElementById('qualitySelect').value,
            resolution: document.getElementById('resolutionSelect').value,
            audio: document.getElementById('audioCheck').checked
        });

        if (result.success) {
            totalConverted++;
        }
    }

    progressSection.style.display = 'none';
    convertBtn.disabled = false;
    convertCount.textContent = totalConverted;
    alert('轉換完成！');
});

clearBtn.addEventListener('click', () => {
    videoFiles = [];
    filesList.innerHTML = '';
    updateUI();
});

function updateUI() {
    filesSection.style.display = videoFiles.length > 0 ? 'block' : 'none';
    settingsSection.style.display = videoFiles.length > 0 ? 'block' : 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
