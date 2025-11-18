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
          <button class="lightbox-btn" id="lightbox-prev" title="Previous">‹</button>
          <button class="lightbox-btn" id="lightbox-next" title="Next">›</button>
          <button class="lightbox-btn" id="lightbox-rotate-left" title="Rotate left">↺</button>
          <button class="lightbox-btn" id="lightbox-rotate-right" title="Rotate right">↻</button>
          <button class="lightbox-btn" id="lightbox-ai" title="AI Analysis">🤖</button>
          <button class="lightbox-btn" id="lightbox-download" title="Download">⬇</button>
          <button class="lightbox-btn" id="lightbox-info" title="Info">ℹ</button>
          <button class="lightbox-btn" id="lightbox-close" title="Close">✕</button>
        </div>
        <div class="lightbox-info-panel" id="lightbox-info-panel"></div>
        <div class="ie-ai-description" id="ie-ai-description"></div>
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
    lightbox.querySelector('#lightbox-ai').addEventListener('click', () => this.toggleAIAnalysis());
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

    // Show progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.className = 'ie-download-progress';
    progressDiv.innerHTML = `
      <div>Downloading ${imagesToDownload.length} images...</div>
      <div class="ie-progress-bar">
        <div class="ie-progress-fill" style="width: 0%"></div>
      </div>
    `;
    document.body.appendChild(progressDiv);

    const progressFill = progressDiv.querySelector('.ie-progress-fill');

    for (let i = 0; i < imagesToDownload.length; i++) {
      const img = imagesToDownload[i];

      await chrome.runtime.sendMessage({
        action: 'downloadImage',
        url: img.src
      });

      // Update progress
      const percent = ((i + 1) / imagesToDownload.length) * 100;
      progressFill.style.width = percent + '%';

      // Small delay to avoid overwhelming the download manager
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Remove progress indicator after completion
    setTimeout(() => progressDiv.remove(), 2000);
  }

  // AI Features

  toggleAIAnalysis() {
    const aiPanel = document.getElementById('ie-ai-description');
    const infoPanel = document.getElementById('lightbox-info-panel');

    // Hide info panel if open
    if (infoPanel.style.display === 'block') {
      infoPanel.style.display = 'none';
    }

    if (aiPanel.classList.contains('active')) {
      aiPanel.classList.remove('active');
    } else {
      this.generateAIDescription();
      aiPanel.classList.add('active');
    }
  }

  async generateAIDescription() {
    const aiPanel = document.getElementById('ie-ai-description');
    const img = this.images[this.currentImageIndex];

    // Show loading state
    aiPanel.innerHTML = `
      <div class="ie-ai-header">AI Image Analysis</div>
      <div class="ie-loading">
        <div class="ie-loading-spinner"></div>
        <span>Analyzing image...</span>
      </div>
    `;

    // Simulate AI analysis (in production, this would call an actual AI service)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate description based on image properties
    const description = this.analyzeImage(img);

    aiPanel.innerHTML = `
      <div class="ie-ai-header">AI Image Analysis</div>
      <div class="ie-ai-text">${description.text}</div>
      ${description.tags.length > 0 ? `
        <div class="ie-ai-tags">
          ${description.tags.map(tag => `<span class="ie-ai-tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
    `;

    // Mark image as analyzed
    img.classList.add('image-ai-analyzed');
  }

  analyzeImage(img) {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const aspectRatio = (width / height).toFixed(2);
    const megapixels = ((width * height) / 1000000).toFixed(1);

    // Determine image type based on aspect ratio and size
    let imageType = '';
    let description = '';
    const tags = [];

    // Analyze aspect ratio
    if (aspectRatio > 1.7) {
      imageType = 'panoramic';
      tags.push('Panorama');
      description = 'This is a wide panoramic image';
    } else if (aspectRatio > 1.3) {
      imageType = 'landscape';
      tags.push('Landscape');
      description = 'This is a landscape-oriented image';
    } else if (aspectRatio < 0.8) {
      imageType = 'portrait';
      tags.push('Portrait');
      description = 'This is a portrait-oriented image';
    } else {
      imageType = 'square';
      tags.push('Square');
      description = 'This is a square image';
    }

    // Analyze resolution
    if (megapixels > 10) {
      tags.push('High Resolution');
      description += ' with exceptionally high resolution';
    } else if (megapixels > 5) {
      tags.push('HD Quality');
      description += ' with high definition quality';
    } else if (megapixels > 2) {
      tags.push('Standard Quality');
      description += ' with standard quality';
    } else {
      tags.push('Low Resolution');
      description += ' with lower resolution';
    }

    // Add size information
    tags.push(`${width}×${height}`);
    tags.push(`${megapixels}MP`);

    // Detect file type from URL
    const url = img.src.toLowerCase();
    if (url.includes('.jpg') || url.includes('.jpeg')) {
      tags.push('JPEG');
    } else if (url.includes('.png')) {
      tags.push('PNG');
    } else if (url.includes('.webp')) {
      tags.push('WebP');
    } else if (url.includes('.gif')) {
      tags.push('GIF');
    }

    // Check for common image types based on URL or size
    if (url.includes('avatar') || url.includes('profile')) {
      tags.push('Profile Picture');
    } else if (url.includes('thumb') || (width < 300 && height < 300)) {
      tags.push('Thumbnail');
    } else if (url.includes('banner') || url.includes('header')) {
      tags.push('Banner');
    } else if (url.includes('logo')) {
      tags.push('Logo');
    }

    // Final description
    description += `. The image has ${megapixels} megapixels (${width}×${height} pixels) with an aspect ratio of ${aspectRatio}.`;

    // Add potential use cases
    if (megapixels > 5 && aspectRatio > 1.2) {
      description += ' Perfect for large prints or high-quality displays.';
    } else if (megapixels > 2) {
      description += ' Suitable for web use and medium-sized prints.';
    }

    return {
      text: description,
      tags: tags.slice(0, 8), // Limit to 8 tags
      type: imageType,
      megapixels: megapixels
    };
  }

  // Enhanced download with AI metadata
  async downloadCurrentImageWithMetadata() {
    const img = this.images[this.currentImageIndex];
    const analysis = this.analyzeImage(img);

    // In production, this could save metadata alongside the image
    await chrome.runtime.sendMessage({
      action: 'downloadImage',
      url: img.src,
      metadata: {
        description: analysis.text,
        tags: analysis.tags,
        type: analysis.type
      }
    });
  }
}

// Initialize
const imageEnhancer = new ImageEnhancer();
