const { ipcRenderer } = require('electron');

const loadFileBtn = document.getElementById('loadFileBtn');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const waveformSection = document.getElementById('waveformSection');
const controlsSection = document.getElementById('controlsSection');
const infoSection = document.getElementById('infoSection');
const waveformCanvas = document.getElementById('waveformCanvas');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const exportBtn = document.getElementById('exportBtn');

let audioContext;
let audioBuffer;
let source;
let gainNode;
let isPlaying = false;
let startTime = 0;
let pauseTime = 0;

loadFileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        await loadAudioFile(e.target.files[0]);
    }
});

async function loadAudioFile(file) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        fileName.textContent = file.name;
        drawWaveform();
        updateInfo();
        showControls();
    } catch (error) {
        alert('載入音頻失敗: ' + error.message);
    }
}

function drawWaveform() {
    const canvas = waveformCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < canvas.width; i++) {
        const min = Math.min(...data.slice(i * step, (i + 1) * step));
        const max = Math.max(...data.slice(i * step, (i + 1) * step));

        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();
}

function updateInfo() {
    document.getElementById('duration').textContent = audioBuffer.duration.toFixed(2) + ' 秒';
    document.getElementById('sampleRate').textContent = audioBuffer.sampleRate + ' Hz';
    document.getElementById('channels').textContent = audioBuffer.numberOfChannels;
}

function showControls() {
    waveformSection.style.display = 'block';
    controlsSection.style.display = 'block';
    infoSection.style.display = 'block';
}

playBtn.addEventListener('click', () => {
    if (!audioBuffer || isPlaying) return;

    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    gainNode = audioContext.createGain();
    gainNode.gain.value = volumeSlider.value / 100;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.playbackRate.value = parseFloat(speedSlider.value);

    if (pauseTime > 0) {
        source.start(0, pauseTime);
        startTime = audioContext.currentTime - pauseTime;
    } else {
        source.start(0);
        startTime = audioContext.currentTime;
    }

    isPlaying = true;

    source.onended = () => {
        isPlaying = false;
        pauseTime = 0;
    };
});

pauseBtn.addEventListener('click', () => {
    if (!isPlaying) return;

    pauseTime = audioContext.currentTime - startTime;
    source.stop();
    isPlaying = false;
});

stopBtn.addEventListener('click', () => {
    if (source) {
        source.stop();
        isPlaying = false;
        pauseTime = 0;
    }
});

volumeSlider.addEventListener('input', (e) => {
    volumeValue.textContent = e.target.value + '%';
    if (gainNode) {
        gainNode.gain.value = e.target.value / 100;
    }
});

speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = e.target.value + 'x';
    if (source) {
        source.playbackRate.value = parseFloat(e.target.value);
    }
});

document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const effect = this.getAttribute('data-effect');
        applyEffect(effect);
    });
});

function applyEffect(effect) {
    if (!audioBuffer) return;

    alert(`音效「${effect}」需要進階音頻處理庫支援`);
}

exportBtn.addEventListener('click', async () => {
    if (!audioBuffer) return;

    // Convert audio buffer to WAV
    const wav = audioBufferToWav(audioBuffer);
    const base64 = arrayBufferToBase64(wav);

    const result = await ipcRenderer.invoke('export-audio', {
        audioData: base64,
        format: document.getElementById('exportFormat').value
    });

    if (result.success) {
        alert('匯出成功！\n位置: ' + result.path);
    }
});

function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Audio data
    const offset = 44;
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let index = 0;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            view.setInt16(offset + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            index++;
        }
    }

    return arrayBuffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
