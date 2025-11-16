// Video Controller Pro - Content Script

class VideoController {
  constructor() {
    this.videos = [];
    this.activeVideo = null;
    this.settings = {
      defaultSpeed: 1.0,
      skipShort: 5,
      skipMedium: 10,
      skipLong: 30,
      volumeStep: 5,
      rememberPosition: true
    };
    this.init();
  }

  async init() {
    // Load settings
    const data = await chrome.storage.sync.get('videoControllerSettings');
    if (data.videoControllerSettings) {
      this.settings = { ...this.settings, ...data.videoControllerSettings };
    }

    // Find and enhance videos
    this.findVideos();
    this.enhanceVideos();

    // Set up mutation observer
    this.setupObserver();

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true;
    });

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  findVideos() {
    this.videos = Array.from(document.querySelectorAll('video'));

    // Set first video as active
    if (this.videos.length > 0 && !this.activeVideo) {
      this.activeVideo = this.videos[0];
    }
  }

  enhanceVideos() {
    this.videos.forEach(video => {
      if (video.dataset.enhanced) return;

      video.dataset.enhanced = 'true';

      // Add control overlay
      this.addControlOverlay(video);

      // Restore playback position if enabled
      if (this.settings.rememberPosition) {
        this.restorePosition(video);
      }

      // Save position periodically
      video.addEventListener('timeupdate', () => {
        if (this.settings.rememberPosition) {
          this.savePosition(video);
        }
      });

      // Update active video on play
      video.addEventListener('play', () => {
        this.activeVideo = video;
      });
    });
  }

  addControlOverlay(video) {
    const overlay = document.createElement('div');
    overlay.className = 'video-controller-overlay';
    overlay.innerHTML = `
      <div class="vc-controls">
        <button class="vc-btn" data-action="speed-down">-</button>
        <span class="vc-speed">1.0x</span>
        <button class="vc-btn" data-action="speed-up">+</button>
        <button class="vc-btn" data-action="screenshot">📷</button>
        <button class="vc-btn" data-action="pip">⧉</button>
      </div>
    `;

    // Position overlay relative to video
    const container = video.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(overlay);

      // Event listeners
      overlay.querySelectorAll('.vc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          this.handleAction(video, action, overlay);
        });
      });

      // Show/hide overlay
      let hideTimeout;
      const showOverlay = () => {
        overlay.style.opacity = '1';
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          overlay.style.opacity = '0';
        }, 2000);
      };

      container.addEventListener('mouseenter', showOverlay);
      container.addEventListener('mousemove', showOverlay);
    }
  }

  handleAction(video, action, overlay) {
    switch (action) {
      case 'speed-up':
        this.changeSpeed(video, 0.25, overlay);
        break;
      case 'speed-down':
        this.changeSpeed(video, -0.25, overlay);
        break;
      case 'screenshot':
        this.takeScreenshot(video);
        break;
      case 'pip':
        this.togglePiP(video);
        break;
    }
  }

  changeSpeed(video, delta, overlay) {
    let newSpeed = parseFloat((video.playbackRate + delta).toFixed(2));
    newSpeed = Math.max(0.25, Math.min(4, newSpeed));

    video.playbackRate = newSpeed;

    // Update display
    const speedDisplay = overlay.querySelector('.vc-speed');
    if (speedDisplay) {
      speedDisplay.textContent = `${newSpeed.toFixed(2)}x`;
    }

    // Save preference
    chrome.storage.sync.set({ lastPlaybackSpeed: newSpeed });
  }

  async togglePiP(video) {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }

  takeScreenshot(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this.activeVideo) return;

      // Skip if typing in input
      if (e.target.matches('input, textarea')) return;

      const video = this.activeVideo;

      switch (e.key) {
        case ' ':
          if (e.target === document.body) {
            e.preventDefault();
            video.paused ? video.play() : video.pause();
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          const backwardTime = e.shiftKey ? this.settings.skipMedium : this.settings.skipShort;
          video.currentTime = Math.max(0, video.currentTime - backwardTime);
          break;

        case 'ArrowRight':
          e.preventDefault();
          const forwardTime = e.shiftKey ? this.settings.skipMedium : this.settings.skipShort;
          video.currentTime = Math.min(video.duration, video.currentTime + forwardTime);
          break;

        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + this.settings.volumeStep / 100);
          break;

        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - this.settings.volumeStep / 100);
          break;

        case '[':
          e.preventDefault();
          this.changeSpeed(video, -0.25, this.getOverlay(video));
          break;

        case ']':
          e.preventDefault();
          this.changeSpeed(video, 0.25, this.getOverlay(video));
          break;

        case 'f':
          e.preventDefault();
          this.toggleFullscreen(video);
          break;

        case 'p':
          e.preventDefault();
          this.togglePiP(video);
          break;

        case 's':
          e.preventDefault();
          this.takeScreenshot(video);
          break;

        // Jump to percentage
        default:
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const percent = parseInt(e.key) / 10;
            video.currentTime = video.duration * percent;
          }
          break;
      }
    });
  }

  toggleFullscreen(video) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen().catch(err => console.error(err));
    }
  }

  getOverlay(video) {
    return video.parentElement.querySelector('.video-controller-overlay');
  }

  async savePosition(video) {
    const url = window.location.href;
    const key = `video-position-${this.hashCode(url)}`;

    await chrome.storage.local.set({
      [key]: {
        time: video.currentTime,
        timestamp: Date.now()
      }
    });
  }

  async restorePosition(video) {
    const url = window.location.href;
    const key = `video-position-${this.hashCode(url)}`;

    const data = await chrome.storage.local.get(key);
    if (data[key]) {
      const { time, timestamp } = data[key];

      // Only restore if less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        video.currentTime = time;
      }
    }
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  setupObserver() {
    const observer = new MutationObserver(() => {
      this.findVideos();
      this.enhanceVideos();
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
        sendResponse({ success: true });
        break;

      case 'getVideoInfo':
        if (this.activeVideo) {
          sendResponse({
            duration: this.activeVideo.duration,
            currentTime: this.activeVideo.currentTime,
            paused: this.activeVideo.paused,
            volume: this.activeVideo.volume,
            playbackRate: this.activeVideo.playbackRate
          });
        } else {
          sendResponse({ error: 'No active video' });
        }
        break;
    }
  }
}

// Initialize
const videoController = new VideoController();
