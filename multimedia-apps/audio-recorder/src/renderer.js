const { ipcRenderer } = require('electron');

class AudioRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    this.analyser = null;
    this.audioBuffer = null;
    this.sourceNode = null;

    this.init();
  }

  async init() {
    this.setupUI();
    await this.setupAudioContext();
    this.setupCanvas();
    this.startVisualization();
  }

  setupUI() {
    this.elements = {
      // 控制按鈕
      recordBtn: document.getElementById('recordBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      playBtn: document.getElementById('playBtn'),
      saveBtn: document.getElementById('saveBtn'),
      openBtn: document.getElementById('openBtn'),

      // 顯示元素
      timer: document.getElementById('timer'),
      status: document.getElementById('status'),
      waveformCanvas: document.getElementById('waveformCanvas'),
      spectrumCanvas: document.getElementById('spectrumCanvas'),

      // 設置
      audioSource: document.getElementById('audioSource'),
      sampleRate: document.getElementById('sampleRate'),
      channels: document.getElementById('channels'),
      bitDepth: document.getElementById('bitDepth'),
      noiseReduction: document.getElementById('noiseReduction'),
      echoCancellation: document.getElementById('echoCancellation'),

      // 音量
      volumeSlider: document.getElementById('volumeSlider'),
      volumeValue: document.getElementById('volumeValue'),
      volumeMeter: document.getElementById('volumeMeter')
    };

    // 綁定事件
    this.elements.recordBtn.addEventListener('click', () => this.startRecording());
    this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
    this.elements.stopBtn.addEventListener('click', () => this.stopRecording());
    this.elements.playBtn.addEventListener('click', () => this.togglePlayback());
    this.elements.saveBtn.addEventListener('click', () => this.saveAudio());
    this.elements.openBtn.addEventListener('click', () => this.openAudioFile());

    this.elements.volumeSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      this.elements.volumeValue.textContent = value + '%';
      if (this.sourceNode && this.sourceNode.gainNode) {
        this.sourceNode.gainNode.gain.value = value / 100;
      }
    });

    this.updateButtonStates();
  }

  async setupAudioContext() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 創建分析器
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  setupCanvas() {
    this.waveformCtx = this.elements.waveformCanvas.getContext('2d');
    this.spectrumCtx = this.elements.spectrumCanvas.getContext('2d');

    // 設置 canvas 大小
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const waveformContainer = this.elements.waveformCanvas.parentElement;
    const spectrumContainer = this.elements.spectrumCanvas.parentElement;

    this.elements.waveformCanvas.width = waveformContainer.clientWidth;
    this.elements.waveformCanvas.height = waveformContainer.clientHeight;

    this.elements.spectrumCanvas.width = spectrumContainer.clientWidth;
    this.elements.spectrumCanvas.height = spectrumContainer.clientHeight;
  }

  async startRecording() {
    try {
      const constraints = {
        audio: {
          channelCount: parseInt(this.elements.channels.value),
          sampleRate: parseInt(this.elements.sampleRate.value),
          echoCancellation: this.elements.echoCancellation.checked,
          noiseSuppression: this.elements.noiseReduction.checked,
          autoGainControl: true
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 連接到分析器
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // 設置 MediaRecorder
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTimer();
      this.updateStatus('正在錄製...', 'recording');
      this.updateButtonStates();

    } catch (error) {
      console.error('錄製失敗:', error);
      this.updateStatus('錄製失敗: ' + error.message, 'error');
    }
  }

  togglePause() {
    if (!this.mediaRecorder || !this.isRecording) return;

    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.resumeTimer();
      this.updateStatus('正在錄製...', 'recording');
      this.elements.pauseBtn.textContent = '⏸ 暫停';
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pauseTimer();
      this.updateStatus('已暫停', 'paused');
      this.elements.pauseBtn.textContent = '▶ 繼續';
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return;

    this.mediaRecorder.stop();
    this.stream.getTracks().forEach(track => track.stop());

    this.isRecording = false;
    this.isPaused = false;
    this.stopTimer();
    this.updateStatus('錄製已停止', 'info');
    this.updateButtonStates();
  }

  async processRecording() {
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const arrayBuffer = await blob.arrayBuffer();

    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.updateStatus('錄製完成，可以播放或保存', 'success');
    this.updateButtonStates();
  }

  togglePlayback() {
    if (!this.audioBuffer) {
      this.updateStatus('沒有可播放的音頻', 'error');
      return;
    }

    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
      this.elements.playBtn.textContent = '▶ 播放';
      this.updateStatus('播放已停止', 'info');
    } else {
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // 創建音量控制
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.elements.volumeSlider.value / 100;
      this.sourceNode.gainNode = gainNode;

      this.sourceNode.connect(gainNode);
      gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.sourceNode.onended = () => {
        this.sourceNode = null;
        this.elements.playBtn.textContent = '▶ 播放';
        this.updateStatus('播放完成', 'info');
      };

      this.sourceNode.start(0);
      this.elements.playBtn.textContent = '⏹ 停止';
      this.updateStatus('正在播放...', 'playing');
    }
  }

  async saveAudio() {
    if (!this.audioBuffer) {
      this.updateStatus('沒有可保存的音頻', 'error');
      return;
    }

    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const buffer = await blob.arrayBuffer();

    const defaultName = `錄音_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.webm`;
    const savePath = await ipcRenderer.invoke('select-save-path', defaultName);

    if (savePath) {
      const result = await ipcRenderer.invoke('save-audio', buffer, savePath);

      if (result.success) {
        this.updateStatus(`音頻已保存: ${result.path}`, 'success');
      } else {
        this.updateStatus(`保存失敗: ${result.error}`, 'error');
      }
    }
  }

  async openAudioFile() {
    const file = await ipcRenderer.invoke('open-audio-file');

    if (!file) return;

    if (file.error) {
      this.updateStatus(`打開文件失敗: ${file.error}`, 'error');
      return;
    }

    try {
      const arrayBuffer = file.data.buffer;
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.updateStatus(`已打開: ${file.name}`, 'success');
      this.updateButtonStates();
    } catch (error) {
      this.updateStatus(`解碼音頻失敗: ${error.message}`, 'error');
    }
  }

  // 可視化
  startVisualization() {
    const draw = () => {
      requestAnimationFrame(draw);

      if (this.analyser) {
        this.drawWaveform();
        this.drawSpectrum();
        this.updateVolumeMeter();
      }
    };

    draw();
  }

  drawWaveform() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    const canvas = this.elements.waveformCanvas;
    const ctx = this.waveformCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#667eea';
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  drawSpectrum() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const canvas = this.elements.spectrumCanvas;
    const ctx = this.spectrumCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  updateVolumeMeter() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const percentage = (average / 255) * 100;

    this.elements.volumeMeter.style.width = percentage + '%';

    if (percentage > 80) {
      this.elements.volumeMeter.style.background = 'linear-gradient(90deg, #ff6b6b, #ff0000)';
    } else if (percentage > 50) {
      this.elements.volumeMeter.style.background = 'linear-gradient(90deg, #ffd93d, #ff6b6b)';
    } else {
      this.elements.volumeMeter.style.background = 'linear-gradient(90deg, #667eea, #764ba2)';
    }
  }

  // 計時器
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => this.updateTimer(), 100);
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.pausedTime = Date.now() - this.startTime;
    }
  }

  resumeTimer() {
    this.startTime = Date.now() - (this.pausedTime || 0);
    this.timerInterval = setInterval(() => this.updateTimer(), 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.elements.timer.textContent = '00:00:00';
  }

  updateTimer() {
    const elapsed = Date.now() - this.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    this.elements.timer.textContent =
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  updateStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }

  updateButtonStates() {
    this.elements.recordBtn.disabled = this.isRecording;
    this.elements.pauseBtn.disabled = !this.isRecording;
    this.elements.stopBtn.disabled = !this.isRecording;
    this.elements.playBtn.disabled = !this.audioBuffer || this.isRecording;
    this.elements.saveBtn.disabled = !this.audioBuffer || this.isRecording;
  }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  new AudioRecorder();
});
