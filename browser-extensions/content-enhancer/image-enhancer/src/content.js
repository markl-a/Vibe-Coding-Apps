// Image Enhancer Pro - Content Script

class ImageEnhancer {
  constructor() {
    this.settings = {
      hoverZoom: true,
      zoomLevel: 2,
      showInfo: true,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0
      }
    };
    this.lightboxOpen = false;
    this.currentImageIndex = 0;
    this.images = [];
    this.init();
  }

  async init() {
    // Load settings
    const data = await chrome.storage.sync.get('imageEnhancerSettings');
    if (data.imageEnhancerSettings) {
      this.settings = { ...this.settings, ...data.imageEnhancerSettings };
    }

    // Find and enhance all images
    this.findImages();
    this.enhanceImages();

    // Set up mutation observer for dynamic content
    this.setupObserver();

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true;
    });

    // Create lightbox
    this.createLightbox();
  }

  findImages() {
    const imgs = document.querySelectorAll('img');
    this.images = Array.from(imgs).filter(img => {
      // Filter out tiny images, icons, etc.
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      return width >= 100 && height >= 100;
    });
  }

  enhanceImages() {
    this.images.forEach((img, index) => {
      // Skip if already enhanced
      if (img.dataset.enhanced) return;

      img.dataset.enhanced = 'true';
      img.dataset.imageIndex = index;

      // Add hover zoom if enabled
      if (this.settings.hoverZoom) {
        this.addHoverZoom(img);
      }

      // Add click to open lightbox
      img.addEventListener('click', (e) => {
        e.preventDefault();
        this.openLightbox(index);
      });

      // Add context menu listener
      img.addEventListener('contextmenu', (e) => {
        this.currentImageIndex = index;
      });

      // Apply filters if set
      this.applyFilters(img);
    });
  }

  addHoverZoom(img) {
    let zoomContainer = null;

    img.addEventListener('mouseenter', (e) => {
      if (this.lightboxOpen) return;

      // Create zoom container
      zoomContainer = document.createElement('div');
      zoomContainer.className = 'image-enhancer-zoom';
      zoomContainer.style.cssText = `
        position: fixed;
        z-index: 999999;
        pointer-events: none;
        border: 3px solid #fff;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        border-radius: 8px;
        overflow: hidden;
      `;

      const zoomedImg = document.createElement('img');
      zoomedImg.src = img.src;
      zoomedImg.style.cssText = `
        display: block;
        width: ${img.naturalWidth || img.width}px;
        height: ${img.naturalHeight || img.height}px;
        transform: scale(${this.settings.zoomLevel});
        transform-origin: top left;
      `;

      zoomContainer.appendChild(zoomedImg);
      document.body.appendChild(zoomContainer);

      this.updateZoomPosition(e, zoomContainer, img);
    });

    img.addEventListener('mousemove', (e) => {
      if (zoomContainer) {
        this.updateZoomPosition(e, zoomContainer, img);
      }
    });

    img.addEventListener('mouseleave', () => {
      if (zoomContainer) {
        zoomContainer.remove();
        zoomContainer = null;
      }
    });
  }

  updateZoomPosition(e, container, img) {
    const x = e.clientX + 20;
    const y = e.clientY + 20;

    // Make sure it stays on screen
    const maxX = window.innerWidth - container.offsetWidth - 40;
    const maxY = window.innerHeight - container.offsetHeight - 40;

    container.style.left = Math.min(x, maxX) + 'px';
    container.style.top = Math.min(y, maxY) + 'px';
  }

  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'image-enhancer-lightbox';
    lightbox.className = 'image-enhancer-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <img class="lightbox-image" />
        <div class="lightbox-controls">
          <button class="lightbox-btn" id="lightbox-prev">‹</button>
          <button class="lightbox-btn" id="lightbox-next">›</button>
          <button class="lightbox-btn" id="lightbox-rotate-left">↺</button>
          <button class="lightbox-btn" id="lightbox-rotate-right">↻</button>
          <button class="lightbox-btn" id="lightbox-download">⬇</button>
          <button class="lightbox-btn" id="lightbox-info">ℹ</button>
          <button class="lightbox-btn" id="lightbox-close">✕</button>
        </div>
        <div class="lightbox-info-panel" id="lightbox-info-panel"></div>
        <div class="lightbox-counter"></div>
      </div>
    `;

    document.body.appendChild(lightbox);

    // Event listeners
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', () => this.closeLightbox());
    lightbox.querySelector('#lightbox-close').addEventListener('click', () => this.closeLightbox());
    lightbox.querySelector('#lightbox-prev').addEventListener('click', () => this.previousImage());
    lightbox.querySelector('#lightbox-next').addEventListener('click', () => this.nextImage());
    lightbox.querySelector('#lightbox-rotate-left').addEventListener('click', () => this.rotateImage(-90));
    lightbox.querySelector('#lightbox-rotate-right').addEventListener('click', () => this.rotateImage(90));
    lightbox.querySelector('#lightbox-download').addEventListener('click', () => this.downloadCurrentImage());
    lightbox.querySelector('#lightbox-info').addEventListener('click', () => this.toggleInfo());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightboxOpen) return;

      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
        case 'r':
          this.rotateImage(e.shiftKey ? -90 : 90);
          break;
        case 'd':
          this.downloadCurrentImage();
          break;
        case 'i':
          this.toggleInfo();
          break;
      }
    });
  }

  openLightbox(index) {
    this.currentImageIndex = index;
    this.lightboxOpen = true;

    const lightbox = document.getElementById('image-enhancer-lightbox');
    const img = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');

    img.src = this.images[index].src;
    img.style.transform = 'rotate(0deg)';
    counter.textContent = `${index + 1} / ${this.images.length}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.lightboxOpen = false;

    const lightbox = document.getElementById('image-enhancer-lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';

    // Hide info panel
    const infoPanel = lightbox.querySelector('#lightbox-info-panel');
    infoPanel.style.display = 'none';
  }

  previousImage() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.openLightbox(this.currentImageIndex);
  }

  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    this.openLightbox(this.currentImageIndex);
  }

  rotateImage(degrees) {
    const lightbox = document.getElementById('image-enhancer-lightbox');
    const img = lightbox.querySelector('.lightbox-image');

    const currentRotation = parseInt(img.dataset.rotation || '0');
    const newRotation = currentRotation + degrees;

    img.dataset.rotation = newRotation;
    img.style.transform = `rotate(${newRotation}deg)`;
  }

  async downloadCurrentImage() {
    const img = this.images[this.currentImageIndex];
    const url = img.src;

    try {
      await chrome.runtime.sendMessage({
        action: 'downloadImage',
        url: url
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  toggleInfo() {
    const lightbox = document.getElementById('image-enhancer-lightbox');
    const infoPanel = lightbox.querySelector('#lightbox-info-panel');
    const img = this.images[this.currentImageIndex];

    if (infoPanel.style.display === 'block') {
      infoPanel.style.display = 'none';
    } else {
      infoPanel.innerHTML = `
        <h3>圖片資訊</h3>
        <p><strong>尺寸:</strong> ${img.naturalWidth} × ${img.naturalHeight}</p>
        <p><strong>顯示:</strong> ${img.width} × ${img.height}</p>
        <p><strong>網址:</strong> <a href="${img.src}" target="_blank">${img.src}</a></p>
        <p><strong>Alt:</strong> ${img.alt || 'N/A'}</p>
      `;
      infoPanel.style.display = 'block';
    }
  }

  applyFilters(img) {
    const { brightness, contrast, saturation, blur, grayscale, sepia } = this.settings.filters;

    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`);
    if (sepia > 0) filters.push(`sepia(${sepia}%)`);

    if (filters.length > 0) {
      img.style.filter = filters.join(' ');
    }
  }

  setupObserver() {
    const observer = new MutationObserver(() => {
      this.findImages();
      this.enhanceImages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        this.findImages();
        this.enhanceImages();
        sendResponse({ success: true });
        break;

      case 'downloadAllImages':
        this.downloadAllImages(request.minSize || 0);
        sendResponse({ success: true, count: this.images.length });
        break;

      case 'getImageCount':
        sendResponse({ count: this.images.length });
        break;
    }
  }

  async downloadAllImages(minSize = 0) {
    const imagesToDownload = this.images.filter(img => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      return width >= minSize && height >= minSize;
    });

    for (const img of imagesToDownload) {
      await chrome.runtime.sendMessage({
        action: 'downloadImage',
        url: img.src
      });

      // Small delay to avoid overwhelming the download manager
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Initialize
const imageEnhancer = new ImageEnhancer();
