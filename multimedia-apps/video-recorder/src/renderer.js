const { ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

class VideoRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    this.selectedSource = null;

    this.init();
  }

  init() {
    this.setupUI();
    this.loadSources();
  }

  setupUI() {
    // 獲取 UI 元素
    this.elements = {
      sourcesList: document.getElementById('sourcesList'),
      refreshBtn: document.getElementById('refreshBtn'),
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      preview: document.getElementById('preview'),
      status: document.getElementById('status'),
      timer: document.getElementById('timer'),
      includeAudio: document.getElementById('includeAudio'),
      audioSource: document.getElementById('audioSource'),
      quality: document.getElementById('quality'),
      fps: document.getElementById('fps')
    };

    // 綁定事件
    this.elements.refreshBtn.addEventListener('click', () => this.loadSources());
    this.elements.startBtn.addEventListener('click', () => this.startRecording());
    this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
    this.elements.stopBtn.addEventListener('click', () => this.stopRecording());

    // 初始化按鈕狀態
    this.updateButtonStates();
  }

  async loadSources() {
    this.updateStatus('正在加載視頻源...');
    const sources = await ipcRenderer.invoke('get-sources');

    this.elements.sourcesList.innerHTML = '';

    sources.forEach(source => {
      const item = document.createElement('div');
      item.className = 'source-item';
      item.innerHTML = `
        <img src="${source.thumbnail}" alt="${source.name}">
        <div class="source-info">
          <div class="source-name">${source.name}</div>
          <div class="source-type">${source.id.startsWith('screen') ? '屏幕' : '窗口'}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedSource = source;
        this.updateStatus(`已選擇: ${source.name}`);
      });

      this.elements.sourcesList.appendChild(item);
    });

    this.updateStatus('請選擇要錄製的源');
  }

  async startRecording() {
    if (!this.selectedSource) {
      this.updateStatus('請先選擇要錄製的源！', 'error');
      return;
    }

    try {
      // 獲取屏幕流
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: this.selectedSource.id,
            minWidth: 1280,
            maxWidth: 3840,
            minHeight: 720,
            maxHeight: 2160,
            frameRate: parseInt(this.elements.fps.value)
          }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 如果需要錄製音頻
      if (this.elements.includeAudio.checked) {
        try {
          const audioConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            },
            video: false
          };

          const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);

          // 合併音視頻流
          const audioTrack = audioStream.getAudioTracks()[0];
          this.stream.addTrack(audioTrack);
        } catch (audioError) {
          console.warn('無法獲取音頻:', audioError);
          this.updateStatus('繼續錄製（無音頻）', 'warning');
        }
      }

      // 設置預覽
      this.elements.preview.srcObject = this.stream;
      this.elements.preview.play();

      // 設置錄製選項
      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.getQualityBitrate()
      };

      // 創建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };

      this.mediaRecorder.start(100); // 每100ms保存一次數據
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
    this.elements.preview.srcObject = null;

    this.isRecording = false;
    this.isPaused = false;
    this.stopTimer();
    this.updateStatus('錄製已停止，正在保存...', 'info');
    this.updateButtonStates();
  }

  async saveRecording() {
    const blob = new Blob(this.recordedChunks, {
      type: 'video/webm'
    });

    const buffer = await blob.arrayBuffer();
    const defaultName = `錄製_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.webm`;
    const savePath = await ipcRenderer.invoke('select-save-path', defaultName);

    if (savePath) {
      const result = await ipcRenderer.invoke('save-video', buffer, savePath);

      if (result.success) {
        this.updateStatus(`視頻已保存: ${result.path}`, 'success');
      } else {
        this.updateStatus(`保存失敗: ${result.error}`, 'error');
      }
    } else {
      this.updateStatus('取消保存', 'info');
    }

    this.recordedChunks = [];
  }

  getQualityBitrate() {
    const quality = this.elements.quality.value;
    const bitrateMap = {
      low: 2500000,      // 2.5 Mbps
      medium: 5000000,   // 5 Mbps
      high: 8000000,     // 8 Mbps
      ultra: 15000000    // 15 Mbps
    };
    return bitrateMap[quality] || bitrateMap.medium;
  }

  // 計時器功能
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
    this.elements.startBtn.disabled = this.isRecording;
    this.elements.pauseBtn.disabled = !this.isRecording;
    this.elements.stopBtn.disabled = !this.isRecording;
    this.elements.refreshBtn.disabled = this.isRecording;
  }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  new VideoRecorder();
});
