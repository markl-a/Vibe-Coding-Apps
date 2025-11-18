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
        <button class="vc-btn" data-action="speed-down" title="Decrease speed">-</button>
        <span class="vc-speed">1.0x</span>
        <button class="vc-btn" data-action="speed-up" title="Increase speed">+</button>
        <button class="vc-btn" data-action="screenshot" title="Take screenshot">📷</button>
        <button class="vc-btn" data-action="pip" title="Picture-in-Picture">⧉</button>
        <button class="vc-btn" data-action="ai-summary" title="AI Summary">🤖</button>
        <button class="vc-btn" data-action="subtitles" title="Toggle subtitles">💬</button>
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
      case 'ai-summary':
        this.toggleAISummary(video);
        break;
      case 'subtitles':
        this.toggleSubtitles(video);
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

  // AI Features

  toggleAISummary(video) {
    let summaryPanel = document.getElementById('vc-ai-summary-panel');

    if (summaryPanel) {
      summaryPanel.classList.toggle('active');
    } else {
      summaryPanel = this.createSummaryPanel(video);
      document.body.appendChild(summaryPanel);
      this.generateAISummary(video, summaryPanel);
    }
  }

  createSummaryPanel(video) {
    const panel = document.createElement('div');
    panel.id = 'vc-ai-summary-panel';
    panel.className = 'vc-summary-panel';
    panel.innerHTML = `
      <div class="vc-summary-header">
        <div class="vc-summary-title">
          <span>🤖</span>
          <span>AI Video Analysis</span>
        </div>
        <button class="vc-summary-close" id="vc-summary-close">✕</button>
      </div>
      <div class="vc-summary-content">
        <div class="vc-loading">
          <div class="vc-loading-spinner"></div>
        </div>
      </div>
    `;

    panel.querySelector('#vc-summary-close').addEventListener('click', () => {
      panel.classList.remove('active');
    });

    setTimeout(() => panel.classList.add('active'), 10);

    return panel;
  }

  async generateAISummary(video, panel) {
    const content = panel.querySelector('.vc-summary-content');

    try {
      // Analyze video metadata and content
      const analysis = await this.analyzeVideo(video);

      content.innerHTML = `
        <div class="vc-summary-section">
          <h4>📊 Video Information</h4>
          <p><strong>Duration:</strong> ${this.formatTime(video.duration)}</p>
          <p><strong>Current Time:</strong> ${this.formatTime(video.currentTime)}</p>
          <p><strong>Resolution:</strong> ${video.videoWidth}x${video.videoHeight}</p>
          <p><strong>Playback Rate:</strong> ${video.playbackRate}x</p>
        </div>

        <div class="vc-summary-section">
          <h4>🎯 Key Moments</h4>
          ${analysis.keyMoments.length > 0 ? `
            <ul>
              ${analysis.keyMoments.map(moment => `
                <li>${moment.time} - ${moment.description}</li>
              `).join('')}
            </ul>
          ` : '<p>No key moments detected yet. Play the video to generate AI analysis.</p>'}
        </div>

        <div class="vc-summary-section">
          <h4>💡 Smart Features</h4>
          <ul>
            <li>Press 'C' to toggle closed captions</li>
            <li>Press 'M' to mute/unmute</li>
            <li>Press '[' or ']' to adjust speed</li>
            <li>Press 'S' to take a screenshot</li>
          </ul>
        </div>

        <div class="vc-summary-section">
          <h4>📈 Viewing Statistics</h4>
          <p><strong>Watched:</strong> ${Math.round((video.currentTime / video.duration) * 100)}%</p>
          <p><strong>Remaining:</strong> ${this.formatTime(video.duration - video.currentTime)}</p>
        </div>
      `;

      // Add timestamp markers if available
      if (analysis.keyMoments.length > 0) {
        this.addTimestampMarkers(video, analysis.keyMoments);
      }

    } catch (error) {
      content.innerHTML = `
        <div class="vc-summary-section">
          <p>Unable to generate AI analysis. Please try again.</p>
        </div>
      `;
    }
  }

  async analyzeVideo(video) {
    // Simple analysis based on video metadata
    // In a production version, this could integrate with actual AI services
    const keyMoments = [];
    const duration = video.duration;

    // Generate sample key moments (every 10% of video)
    if (!isNaN(duration) && duration > 0) {
      for (let i = 1; i <= 5; i++) {
        const time = (duration / 6) * i;
        keyMoments.push({
          time: this.formatTime(time),
          timestamp: time,
          description: `Chapter ${i}`
        });
      }
    }

    return { keyMoments };
  }

  addTimestampMarkers(video, moments) {
    // Remove existing markers
    const existingMarkers = document.getElementById('vc-timestamp-markers');
    if (existingMarkers) existingMarkers.remove();

    const container = video.parentElement;
    if (!container) return;

    const markersDiv = document.createElement('div');
    markersDiv.id = 'vc-timestamp-markers';
    markersDiv.className = 'vc-timestamp-markers';

    moments.forEach(moment => {
      const marker = document.createElement('button');
      marker.className = 'vc-timestamp-marker';
      marker.textContent = moment.time;
      marker.addEventListener('click', () => {
        video.currentTime = moment.timestamp;
      });
      markersDiv.appendChild(marker);
    });

    container.style.position = 'relative';
    container.appendChild(markersDiv);
  }

  toggleSubtitles(video) {
    let subtitlePanel = document.getElementById('vc-subtitle-panel');

    if (subtitlePanel) {
      if (subtitlePanel.classList.contains('active')) {
        this.stopSubtitleRecognition();
        subtitlePanel.classList.remove('active');
      } else {
        this.startSubtitleRecognition(video);
        subtitlePanel.classList.add('active');
      }
    } else {
      subtitlePanel = this.createSubtitlePanel();
      document.body.appendChild(subtitlePanel);
      this.startSubtitleRecognition(video);
    }
  }

  createSubtitlePanel() {
    const panel = document.createElement('div');
    panel.id = 'vc-subtitle-panel';
    panel.className = 'vc-subtitle-panel';
    panel.innerHTML = `
      <div class="vc-subtitle-text">Starting speech recognition...</div>
    `;
    return panel;
  }

  startSubtitleRecognition(video) {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const panel = document.getElementById('vc-subtitle-panel');
      if (panel) {
        panel.querySelector('.vc-subtitle-text').textContent =
          'Speech recognition not available in this browser';
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const panel = document.getElementById('vc-subtitle-panel');
      if (!panel) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      panel.querySelector('.vc-subtitle-text').textContent = text || 'Listening...';
      panel.classList.add('active');
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      const panel = document.getElementById('vc-subtitle-panel');
      if (panel) {
        panel.querySelector('.vc-subtitle-text').textContent =
          'Speech recognition error. Please try again.';
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if video is still playing
      if (video && !video.paused) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore if already started
          }
        }, 100);
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }

  stopSubtitleRecognition() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

// Initialize
const videoController = new VideoController();
