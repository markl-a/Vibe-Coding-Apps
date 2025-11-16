const { ipcRenderer } = require('electron');

class WebcamCapture {
  constructor() {
    this.stream = null;
    this.mediaRecorder = null;
    this.videoChunks = [];
    this.isRecording = false;
    this.photos = [];
    this.currentFilter = 'none';
    this.countdownTimer = null;

    this.init();
  }

  async init() {
    this.setupUI();
    await this.initCamera();
  }

  setupUI() {
    this.elements = {
      // 視頻和畫布
      video: document.getElementById('video'),
      canvas: document.getElementById('canvas'),
      photoCanvas: document.getElementById('photoCanvas'),

      // 控制按鈕
      captureBtn: document.getElementById('captureBtn'),
      recordBtn: document.getElementById('recordBtn'),
      timerCaptureBtn: document.getElementById('timerCaptureBtn'),
      burstBtn: document.getElementById('burstBtn'),

      // 設置
      cameraSelect: document.getElementById('cameraSelect'),
      resolution: document.getElementById('resolution'),
      photoFormat: document.getElementById('photoFormat'),
      videoQuality: document.getElementById('videoQuality'),

      // 濾鏡按鈕
      filterBtns: document.querySelectorAll('.filter-btn'),

      // 圖庫
      gallery: document.getElementById('gallery'),
      deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
      exportSelectedBtn: document.getElementById('exportSelectedBtn'),
      clearAllBtn: document.getElementById('clearAllBtn'),

      // 狀態
      status: document.getElementById('status'),
      recordingTime: document.getElementById('recordingTime'),
      countdown: document.getElementById('countdown')
    };

    // 綁定事件
    this.elements.captureBtn.addEventListener('click', () => this.capturePhoto());
    this.elements.recordBtn.addEventListener('click', () => this.toggleRecording());
    this.elements.timerCaptureBtn.addEventListener('click', () => this.timerCapture());
    this.elements.burstBtn.addEventListener('click', () => this.burstCapture());

    this.elements.cameraSelect.addEventListener('change', () => this.switchCamera());
    this.elements.resolution.addEventListener('change', () => this.switchCamera());

    this.elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => this.applyFilter(btn.dataset.filter));
    });

    this.elements.deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
    this.elements.exportSelectedBtn.addEventListener('click', () => this.exportSelected());
    this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  async initCamera() {
    try {
      // 獲取可用的攝像頭
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // 填充攝像頭選擇器
      this.elements.cameraSelect.innerHTML = '';
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `攝像頭 ${index + 1}`;
        this.elements.cameraSelect.appendChild(option);
      });

      // 啟動攝像頭
      await this.startCamera();
      this.updateStatus('攝像頭已就緒', 'success');

    } catch (error) {
      console.error('初始化攝像頭失敗:', error);
      this.updateStatus('攝像頭初始化失敗: ' + error.message, 'error');
    }
  }

  async startCamera() {
    const resolution = this.elements.resolution.value.split('x');
    const width = parseInt(resolution[0]);
    const height = parseInt(resolution[1]);

    const constraints = {
      video: {
        deviceId: this.elements.cameraSelect.value || undefined,
        width: { ideal: width },
        height: { ideal: height }
      }
    };

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.elements.video.srcObject = this.stream;

    // 設置畫布大小
    this.elements.video.addEventListener('loadedmetadata', () => {
      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;
    });
  }

  async switchCamera() {
    await this.startCamera();
    this.updateStatus('已切換攝像頭', 'info');
  }

  capturePhoto() {
    const ctx = this.elements.canvas.getContext('2d');

    // 繪製當前視頻幀
    ctx.filter = this.getCSSFilter();
    ctx.drawImage(
      this.elements.video,
      0, 0,
      this.elements.canvas.width,
      this.elements.canvas.height
    );
    ctx.filter = 'none';

    // 轉換為圖片
    const format = this.elements.photoFormat.value;
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    const dataUrl = this.elements.canvas.toDataURL(mimeType, quality);

    // 添加到圖庫
    this.addPhotoToGallery(dataUrl);
    this.updateStatus('照片已拍攝', 'success');

    // 閃光效果
    this.flashEffect();
  }

  async timerCapture() {
    let countdown = 3;
    this.elements.countdown.style.display = 'flex';

    this.countdownTimer = setInterval(() => {
      this.elements.countdown.querySelector('.countdown-number').textContent = countdown;

      if (countdown === 0) {
        clearInterval(this.countdownTimer);
        this.elements.countdown.style.display = 'none';
        this.capturePhoto();
      }

      countdown--;
    }, 1000);
  }

  async burstCapture() {
    this.updateStatus('連拍中...', 'info');

    for (let i = 0; i < 5; i++) {
      this.capturePhoto();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.updateStatus('連拍完成（5張）', 'success');
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  async startRecording() {
    try {
      const quality = this.elements.videoQuality.value;
      const bitrate = quality === 'high' ? 8000000 : quality === 'medium' ? 5000000 : 2500000;

      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: bitrate
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.videoChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.videoChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveVideo();
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startRecordingTimer();

      this.elements.recordBtn.textContent = '⏹ 停止錄像';
      this.elements.recordBtn.classList.add('recording');
      this.updateStatus('正在錄製視頻...', 'recording');

    } catch (error) {
      console.error('錄製失敗:', error);
      this.updateStatus('錄製失敗: ' + error.message, 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopRecordingTimer();

      this.elements.recordBtn.textContent = '🎥 錄像';
      this.elements.recordBtn.classList.remove('recording');
      this.updateStatus('視頻錄製已停止', 'info');
    }
  }

  async saveVideo() {
    const blob = new Blob(this.videoChunks, { type: 'video/webm' });
    const buffer = await blob.arrayBuffer();

    const fileName = `視頻_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.webm`;
    const result = await ipcRenderer.invoke('save-video', buffer, fileName);

    if (result.success) {
      this.updateStatus(`視頻已保存: ${result.path}`, 'success');
    } else if (!result.canceled) {
      this.updateStatus(`保存失敗: ${result.error}`, 'error');
    }
  }

  applyFilter(filter) {
    this.currentFilter = filter;
    this.elements.video.style.filter = this.getCSSFilter();

    // 更新按鈕狀態
    this.elements.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.updateStatus(`已應用濾鏡: ${this.getFilterName(filter)}`, 'info');
  }

  getCSSFilter() {
    const filters = {
      none: 'none',
      grayscale: 'grayscale(100%)',
      sepia: 'sepia(100%)',
      invert: 'invert(100%)',
      blur: 'blur(3px)',
      brightness: 'brightness(1.2)',
      contrast: 'contrast(1.5)',
      saturate: 'saturate(2)'
    };

    return filters[this.currentFilter] || 'none';
  }

  getFilterName(filter) {
    const names = {
      none: '無',
      grayscale: '黑白',
      sepia: '復古',
      invert: '反色',
      blur: '模糊',
      brightness: '增亮',
      contrast: '高對比',
      saturate: '飽和'
    };

    return names[filter] || filter;
  }

  addPhotoToGallery(dataUrl) {
    const photo = {
      id: Date.now(),
      data: dataUrl,
      name: `照片_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.${this.elements.photoFormat.value}`,
      timestamp: new Date()
    };

    this.photos.push(photo);
    this.renderGallery();
  }

  renderGallery() {
    this.elements.gallery.innerHTML = '';

    this.photos.forEach(photo => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.id = photo.id;

      item.innerHTML = `
        <img src="${photo.data}" alt="${photo.name}">
        <div class="gallery-item-actions">
          <button class="btn-small" onclick="app.savePhoto(${photo.id})">💾</button>
          <button class="btn-small" onclick="app.deletePhoto(${photo.id})">🗑️</button>
        </div>
        <div class="gallery-item-info">${photo.name}</div>
      `;

      // 點擊選擇
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          item.classList.toggle('selected');
        }
      });

      this.elements.gallery.appendChild(item);
    });
  }

  async savePhoto(id) {
    const photo = this.photos.find(p => p.id === id);
    if (!photo) return;

    const result = await ipcRenderer.invoke('save-photo', photo.data, photo.name);

    if (result.success) {
      this.updateStatus(`照片已保存: ${result.path}`, 'success');
    } else if (!result.canceled) {
      this.updateStatus(`保存失敗: ${result.error}`, 'error');
    }
  }

  deletePhoto(id) {
    this.photos = this.photos.filter(p => p.id !== id);
    this.renderGallery();
    this.updateStatus('照片已刪除', 'info');
  }

  deleteSelected() {
    const selected = document.querySelectorAll('.gallery-item.selected');
    const ids = Array.from(selected).map(item => parseInt(item.dataset.id));

    this.photos = this.photos.filter(p => !ids.includes(p.id));
    this.renderGallery();
    this.updateStatus(`已刪除 ${ids.length} 張照片`, 'info');
  }

  async exportSelected() {
    const selected = document.querySelectorAll('.gallery-item.selected');
    const ids = Array.from(selected).map(item => parseInt(item.dataset.id));
    const photos = this.photos.filter(p => ids.includes(p.id));

    if (photos.length === 0) {
      this.updateStatus('請先選擇要導出的照片', 'warning');
      return;
    }

    const result = await ipcRenderer.invoke('export-photos', photos);

    if (result.success) {
      this.updateStatus(`已導出 ${result.count}/${result.total} 張照片到 ${result.path}`, 'success');
    } else if (!result.canceled) {
      this.updateStatus(`導出失敗: ${result.error}`, 'error');
    }
  }

  clearAll() {
    if (confirm('確定要清空所有照片嗎？此操作無法撤銷。')) {
      this.photos = [];
      this.renderGallery();
      this.updateStatus('圖庫已清空', 'info');
    }
  }

  flashEffect() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      pointer-events: none;
      animation: flash 0.3s ease-out;
    `;

    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }

  startRecordingTimer() {
    this.recordingStartTime = Date.now();
    this.recordingTimerInterval = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      this.elements.recordingTime.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      this.elements.recordingTime.style.display = 'block';
    }, 100);
  }

  stopRecordingTimer() {
    if (this.recordingTimerInterval) {
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = null;
      this.elements.recordingTime.style.display = 'none';
    }
  }

  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'r') {
        e.preventDefault();
        this.toggleRecording();
      } else if (e.key === 's') {
        e.preventDefault();
        const selected = document.querySelector('.gallery-item.selected');
        if (selected) {
          this.savePhoto(parseInt(selected.dataset.id));
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        this.deleteSelected();
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      this.capturePhoto();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    } else if (e.key >= '1' && e.key <= '8') {
      const filters = ['none', 'grayscale', 'sepia', 'invert', 'blur', 'brightness', 'contrast', 'saturate'];
      const index = parseInt(e.key) - 1;
      if (index < filters.length) {
        this.applyFilter(filters[index]);
      }
    }
  }

  updateStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }
}

// CSS 動畫
const style = document.createElement('style');
style.textContent = `
  @keyframes flash {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);

// 創建全局實例
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new WebcamCapture();
});
