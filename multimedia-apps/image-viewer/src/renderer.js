const { ipcRenderer } = require('electron');

class ImageViewer {
  constructor() {
    this.currentImage = null;
    this.images = [];
    this.currentIndex = 0;
    this.scale = 1;
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;

    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.img = new Image();

    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  setupEventListeners() {
    // 開啟圖片按鈕
    document.getElementById('openBtn').addEventListener('click', () => this.openImage());

    // 儲存按鈕
    document.getElementById('saveBtn').addEventListener('click', () => this.saveImage());

    // 縮放按鈕
    document.getElementById('zoomInBtn').addEventListener('click', () => this.zoom(1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoom(0.8));
    document.getElementById('fitBtn').addEventListener('click', () => this.fitToWindow());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetTransform());

    // 旋轉與翻轉
    document.getElementById('rotateRBtn').addEventListener('click', () => this.rotate(90));
    document.getElementById('rotateLBtn').addEventListener('click', () => this.rotate(-90));
    document.getElementById('flipHBtn').addEventListener('click', () => this.flipHorizontal());
    document.getElementById('flipVBtn').addEventListener('click', () => this.flipVertical());

    // 濾鏡
    document.getElementById('grayscaleBtn').addEventListener('click', () => this.applyFilter('grayscale'));
    document.getElementById('sepiaBtn').addEventListener('click', () => this.applyFilter('sepia'));
    document.getElementById('invertBtn').addEventListener('click', () => this.applyFilter('invert'));
    document.getElementById('clearFilterBtn').addEventListener('click', () => this.clearFilter());

    // 導航
    document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
    document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));

    // 拖拽支援
    const dropZone = document.getElementById('dropZone');
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

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(f => f.type.startsWith('image/'));

      if (imageFile) {
        this.loadImageFromFile(imageFile);
      }
    });

    // 滾輪縮放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(delta);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + O: 開啟
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        this.openImage();
      }

      // Ctrl/Cmd + S: 儲存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveImage();
      }

      // Ctrl/Cmd + +: 放大
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        this.zoom(1.2);
      }

      // Ctrl/Cmd + -: 縮小
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        this.zoom(0.8);
      }

      // Ctrl/Cmd + 0: 重置
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        this.resetTransform();
      }

      // 方向鍵: 導航
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);

      // R: 旋轉
      if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) {
          this.rotate(-90);
        } else {
          this.rotate(90);
        }
      }

      // F: 適應視窗
      if (e.key === 'f' || e.key === 'F') {
        this.fitToWindow();
      }
    });
  }

  async openImage() {
    const imageData = await ipcRenderer.invoke('open-image-dialog');

    if (imageData) {
      this.images = imageData.siblings;
      this.currentIndex = this.images.indexOf(imageData.path);
      await this.loadImage(imageData.path);
    }
  }

  async loadImage(imagePath) {
    const info = await ipcRenderer.invoke('get-image-info', imagePath);

    if (info) {
      this.currentImage = imagePath;
      this.img.onload = () => {
        this.resetTransform();
        this.render();
        this.updateInfo(info);
      };
      this.img.src = info.dataUrl;

      document.getElementById('dropZone').style.display = 'none';
      this.canvas.style.display = 'block';
    }
  }

  loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentImage = file.name;
      this.img.onload = () => {
        this.resetTransform();
        this.render();
      };
      this.img.src = e.target.result;

      document.getElementById('dropZone').style.display = 'none';
      this.canvas.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  render() {
    const canvasWidth = this.canvas.parentElement.clientWidth;
    const canvasHeight = this.canvas.parentElement.clientHeight;

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.save();

    // 置中
    this.ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // 縮放
    this.ctx.scale(this.scale, this.scale);

    // 旋轉
    this.ctx.rotate(this.rotation * Math.PI / 180);

    // 翻轉
    if (this.flipH) this.ctx.scale(-1, 1);
    if (this.flipV) this.ctx.scale(1, -1);

    // 繪製圖片
    this.ctx.drawImage(
      this.img,
      -this.img.width / 2,
      -this.img.height / 2
    );

    this.ctx.restore();
  }

  zoom(factor) {
    this.scale *= factor;
    this.scale = Math.max(0.1, Math.min(10, this.scale));
    this.render();
    this.updateZoomLevel();
  }

  fitToWindow() {
    const canvasWidth = this.canvas.parentElement.clientWidth;
    const canvasHeight = this.canvas.parentElement.clientHeight;

    const scaleX = canvasWidth / this.img.width;
    const scaleY = canvasHeight / this.img.height;

    this.scale = Math.min(scaleX, scaleY) * 0.9;
    this.render();
    this.updateZoomLevel();
  }

  resetTransform() {
    this.scale = 1;
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.fitToWindow();
  }

  rotate(degrees) {
    this.rotation = (this.rotation + degrees) % 360;
    this.render();
  }

  flipHorizontal() {
    this.flipH = !this.flipH;
    this.render();
  }

  flipVertical() {
    this.flipV = !this.flipV;
    this.render();
  }

  applyFilter(filterType) {
    this.ctx.filter = this.getFilterString(filterType);
    this.render();
  }

  getFilterString(type) {
    switch(type) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'invert': return 'invert(100%)';
      default: return 'none';
    }
  }

  clearFilter() {
    this.ctx.filter = 'none';
    this.render();
  }

  navigate(direction) {
    if (this.images.length === 0) return;

    this.currentIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
    this.loadImage(this.images[this.currentIndex]);
  }

  async saveImage() {
    if (!this.currentImage) return;

    const dataUrl = this.canvas.toDataURL('image/png');
    const result = await ipcRenderer.invoke('save-image-dialog', dataUrl);

    if (result.success) {
      alert('圖片已儲存!');
    } else if (result.error) {
      alert('儲存失敗: ' + result.error);
    }
  }

  updateInfo(info) {
    const sizeKB = (info.size / 1024).toFixed(2);
    document.getElementById('imageInfo').innerHTML = `
      <strong>${this.img.width} × ${this.img.height}</strong> px | ${sizeKB} KB
    `;
  }

  updateZoomLevel() {
    document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
  }
}

// 初始化
const viewer = new ImageViewer();
