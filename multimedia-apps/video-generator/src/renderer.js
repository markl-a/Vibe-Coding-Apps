/**
 * Renderer Process
 * Handles UI interactions, preview, and video generation
 */

const { ipcRenderer } = require('electron');
const path = require('path');

// Global state
const state = {
  mode: 'slideshow',
  images: [],
  audioFile: null,
  frameDuration: 3,
  transition: 'fade',
  transitionDuration: 0.5,
  textContent: '',
  textAnimation: 'fade-in',
  textFont: 'Arial',
  textSize: 48,
  textColor: '#ffffff',
  bgColor: '#1a1a2e',
  textDuration: 5,
  selectedTemplate: null,
  templateParams: {},
  vizType: 'bar-chart',
  vizData: [10, 25, 15, 30, 20, 35],
  vizColor: '#667eea',
  vizDuration: 10,
  vizAnimated: true,
  exportFormat: 'mp4',
  exportResolution: '1920x1080',
  exportFPS: 30,
  exportQuality: 'high',
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0
};

// Video engine
let videoEngine;
let previewInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('previewCanvas');
  videoEngine = new VideoEngine(canvas);
  videoEngine.setResolution(1280, 720);

  initializeEventListeners();
  updatePreview();
});

// Event Listeners
function initializeEventListeners() {
  // Mode selection
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      switchMode(state.mode);
    });
  });

  // Slideshow controls
  document.getElementById('addImagesBtn')?.addEventListener('click', addImages);
  document.getElementById('frameDuration')?.addEventListener('input', e => {
    state.frameDuration = parseFloat(e.target.value);
    updatePreview();
  });
  document.getElementById('transition')?.addEventListener('change', e => {
    state.transition = e.target.value;
    updatePreview();
  });
  document.getElementById('transitionDuration')?.addEventListener('input', e => {
    state.transitionDuration = parseFloat(e.target.value);
    updatePreview();
  });
  document.getElementById('addMusicBtn')?.addEventListener('click', addMusic);

  // Text animation controls
  document.getElementById('textContent')?.addEventListener('input', e => {
    state.textContent = e.target.value;
    updatePreview();
  });
  document.getElementById('textAnimation')?.addEventListener('change', e => {
    state.textAnimation = e.target.value;
    updatePreview();
  });
  document.getElementById('textFont')?.addEventListener('change', e => {
    state.textFont = e.target.value;
    updatePreview();
  });
  document.getElementById('textSize')?.addEventListener('input', e => {
    state.textSize = parseInt(e.target.value);
    updatePreview();
  });
  document.getElementById('textColor')?.addEventListener('input', e => {
    state.textColor = e.target.value;
    updatePreview();
  });
  document.getElementById('bgColor')?.addEventListener('input', e => {
    state.bgColor = e.target.value;
    updatePreview();
  });
  document.getElementById('textDuration')?.addEventListener('input', e => {
    state.textDuration = parseFloat(e.target.value);
    updatePreview();
  });

  // Template controls
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.selectedTemplate = card.dataset.template;
      loadTemplateParams(state.selectedTemplate);
      updatePreview();
    });
  });

  // Visualization controls
  document.getElementById('vizType')?.addEventListener('change', e => {
    state.vizType = e.target.value;
    updatePreview();
  });
  document.getElementById('vizData')?.addEventListener('input', e => {
    state.vizData = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    updatePreview();
  });
  document.getElementById('vizColor')?.addEventListener('input', e => {
    state.vizColor = e.target.value;
    updatePreview();
  });
  document.getElementById('vizDuration')?.addEventListener('input', e => {
    state.vizDuration = parseFloat(e.target.value);
    updatePreview();
  });
  document.getElementById('vizAnimated')?.addEventListener('change', e => {
    state.vizAnimated = e.target.checked;
    updatePreview();
  });

  // Preview controls
  document.getElementById('playBtn')?.addEventListener('click', playPreview);
  document.getElementById('pauseBtn')?.addEventListener('click', pausePreview);
  document.getElementById('stopBtn')?.addEventListener('click', stopPreview);
  document.getElementById('timelineSlider')?.addEventListener('input', e => {
    const value = parseFloat(e.target.value);
    state.currentTime = (value / 100) * state.totalDuration;
    updatePreviewFrame();
  });

  // Export controls
  document.getElementById('exportFormat')?.addEventListener('change', e => {
    state.exportFormat = e.target.value;
  });
  document.getElementById('exportResolution')?.addEventListener('change', e => {
    state.exportResolution = e.target.value;
  });
  document.getElementById('exportFPS')?.addEventListener('change', e => {
    state.exportFPS = parseInt(e.target.value);
  });
  document.getElementById('exportQuality')?.addEventListener('change', e => {
    state.exportQuality = e.target.value;
  });
  document.getElementById('generateBtn')?.addEventListener('click', generateVideo);

  // Project controls
  document.getElementById('saveProjectBtn')?.addEventListener('click', saveProject);
  document.getElementById('openProjectBtn')?.addEventListener('click', openProject);
}

// Switch mode
function switchMode(mode) {
  document.querySelectorAll('.controls-section').forEach(section => {
    section.classList.add('hidden');
  });

  switch (mode) {
    case 'slideshow':
      document.getElementById('slideshowControls').classList.remove('hidden');
      break;
    case 'text-animation':
      document.getElementById('textAnimationControls').classList.remove('hidden');
      break;
    case 'template':
      document.getElementById('templateControls').classList.remove('hidden');
      break;
    case 'visualization':
      document.getElementById('visualizationControls').classList.remove('hidden');
      break;
  }

  updatePreview();
}

// Add images
async function addImages() {
  const filePaths = await ipcRenderer.invoke('select-images');

  if (filePaths.length === 0) return;

  for (const filePath of filePaths) {
    const dataUrl = await ipcRenderer.invoke('read-file', filePath);
    if (dataUrl) {
      state.images.push({
        path: filePath,
        name: path.basename(filePath),
        dataUrl: dataUrl
      });
    }
  }

  updateImageList();
  updatePreview();
}

// Update image list UI
function updateImageList() {
  const imageList = document.getElementById('imageList');
  imageList.innerHTML = '';

  state.images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'image-item';
    item.innerHTML = `
      <img src="${img.dataUrl}" alt="${img.name}">
      <div class="image-item-info">
        <div class="image-item-name">${img.name}</div>
      </div>
      <button class="image-item-remove" data-index="${index}">×</button>
    `;

    item.querySelector('.image-item-remove').addEventListener('click', () => {
      removeImage(index);
    });

    imageList.appendChild(item);
  });
}

// Remove image
function removeImage(index) {
  state.images.splice(index, 1);
  updateImageList();
  updatePreview();
}

// Add music
async function addMusic() {
  const filePath = await ipcRenderer.invoke('select-audio');

  if (!filePath) return;

  state.audioFile = {
    path: filePath,
    name: path.basename(filePath)
  };

  document.getElementById('musicInfo').innerHTML = `
    <div>🎵 ${state.audioFile.name}</div>
    <button class="btn btn-secondary btn-block mt-1" onclick="removeMusic()">Remove</button>
  `;
}

// Remove music
function removeMusic() {
  state.audioFile = null;
  document.getElementById('musicInfo').innerHTML = '';
}

// Load template parameters
function loadTemplateParams(templateName) {
  const paramsContainer = document.getElementById('templateParams');

  const templates = {
    'simple-intro': {
      title: { label: 'Title', type: 'text', default: 'Welcome' },
      subtitle: { label: 'Subtitle', type: 'text', default: 'To Our Presentation' },
      bgColor: { label: 'Background Color', type: 'color', default: '#1a1a2e' }
    },
    'product-showcase': {
      productName: { label: 'Product Name', type: 'text', default: 'Amazing Product' },
      description: { label: 'Description', type: 'text', default: 'The best product ever' },
      image: { label: 'Product Image', type: 'file', default: null }
    },
    'social-post': {
      message: { label: 'Message', type: 'textarea', default: 'Check this out!' },
      hashtag: { label: 'Hashtag', type: 'text', default: '#awesome' }
    },
    'event-announcement': {
      eventName: { label: 'Event Name', type: 'text', default: 'Big Event' },
      date: { label: 'Date', type: 'text', default: 'December 31, 2024' },
      time: { label: 'Time', type: 'text', default: '7:00 PM' }
    },
    'quote-video': {
      quote: { label: 'Quote', type: 'textarea', default: 'Be the change you wish to see' },
      author: { label: 'Author', type: 'text', default: 'Anonymous' }
    }
  };

  const params = templates[templateName] || {};
  paramsContainer.innerHTML = '';

  Object.keys(params).forEach(key => {
    const param = params[key];
    const group = document.createElement('div');
    group.className = 'control-group';

    let input = '';
    if (param.type === 'text') {
      input = `<input type="text" id="template-${key}" value="${param.default}">`;
    } else if (param.type === 'textarea') {
      input = `<textarea id="template-${key}" rows="3">${param.default}</textarea>`;
    } else if (param.type === 'color') {
      input = `<input type="color" id="template-${key}" value="${param.default}">`;
    } else if (param.type === 'file') {
      input = `<button class="btn btn-secondary btn-block" id="template-${key}">Select Image</button>`;
    }

    group.innerHTML = `
      <label for="template-${key}">${param.label}</label>
      ${input}
    `;

    paramsContainer.appendChild(group);

    if (param.type !== 'file') {
      document.getElementById(`template-${key}`).addEventListener('input', e => {
        state.templateParams[key] = e.target.value;
        updatePreview();
      });
    }

    state.templateParams[key] = param.default;
  });
}

// Update preview
function updatePreview() {
  const overlay = document.getElementById('previewOverlay');

  switch (state.mode) {
    case 'slideshow':
      if (state.images.length === 0) {
        overlay.classList.remove('hidden');
        return;
      }
      overlay.classList.add('hidden');
      renderSlideshowPreview();
      break;

    case 'text-animation':
      if (!state.textContent) {
        overlay.classList.remove('hidden');
        return;
      }
      overlay.classList.add('hidden');
      renderTextAnimationPreview();
      break;

    case 'template':
      if (!state.selectedTemplate) {
        overlay.classList.remove('hidden');
        return;
      }
      overlay.classList.add('hidden');
      renderTemplatePreview();
      break;

    case 'visualization':
      overlay.classList.add('hidden');
      renderVisualizationPreview();
      break;
  }

  calculateTotalDuration();
  updateTimelineDisplay();
}

// Render slideshow preview
function renderSlideshowPreview() {
  if (state.images.length === 0) return;

  const img = new Image();
  img.onload = () => {
    videoEngine.clear();
    videoEngine.drawImage(img);
  };
  img.src = state.images[0].dataUrl;
}

// Render text animation preview
function renderTextAnimationPreview() {
  videoEngine.clear();
  videoEngine.ctx.fillStyle = state.bgColor;
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const options = {
    font: `${state.textSize}px ${state.textFont}`,
    color: state.textColor,
    x: videoEngine.canvas.width / 2,
    y: videoEngine.canvas.height / 2
  };

  const progress = 1; // Show fully rendered for preview

  switch (state.textAnimation) {
    case 'fade-in':
      videoEngine.animateTextFadeIn(state.textContent, progress, options);
      break;
    case 'slide-in-left':
      videoEngine.animateTextSlideIn(state.textContent, progress, 'left', options);
      break;
    case 'slide-in-right':
      videoEngine.animateTextSlideIn(state.textContent, progress, 'right', options);
      break;
    case 'slide-in-top':
      videoEngine.animateTextSlideIn(state.textContent, progress, 'top', options);
      break;
    case 'slide-in-bottom':
      videoEngine.animateTextSlideIn(state.textContent, progress, 'bottom', options);
      break;
    case 'typewriter':
      videoEngine.animateTextTypewriter(state.textContent, progress, options);
      break;
    case 'scale-in':
      videoEngine.animateTextScaleIn(state.textContent, progress, options);
      break;
    case 'rotate-in':
      videoEngine.animateTextRotateIn(state.textContent, progress, options);
      break;
    case 'bounce':
      videoEngine.animateTextBounce(state.textContent, progress, options);
      break;
  }
}

// Render template preview
function renderTemplatePreview() {
  videoEngine.clear();

  switch (state.selectedTemplate) {
    case 'simple-intro':
      renderSimpleIntroTemplate();
      break;
    case 'product-showcase':
      renderProductShowcaseTemplate();
      break;
    case 'social-post':
      renderSocialPostTemplate();
      break;
    case 'event-announcement':
      renderEventAnnouncementTemplate();
      break;
    case 'quote-video':
      renderQuoteVideoTemplate();
      break;
  }
}

// Template renderers
function renderSimpleIntroTemplate() {
  const bgColor = state.templateParams.bgColor || '#1a1a2e';
  videoEngine.ctx.fillStyle = bgColor;
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const title = state.templateParams.title || 'Welcome';
  const subtitle = state.templateParams.subtitle || 'To Our Presentation';

  videoEngine.ctx.fillStyle = '#ffffff';
  videoEngine.ctx.font = 'bold 72px Arial';
  videoEngine.ctx.textAlign = 'center';
  videoEngine.ctx.fillText(title, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 - 40);

  videoEngine.ctx.font = '36px Arial';
  videoEngine.ctx.fillText(subtitle, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 + 40);
}

function renderProductShowcaseTemplate() {
  const gradient = videoEngine.ctx.createLinearGradient(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  videoEngine.ctx.fillStyle = gradient;
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const productName = state.templateParams.productName || 'Amazing Product';
  const description = state.templateParams.description || 'The best product ever';

  videoEngine.ctx.fillStyle = '#ffffff';
  videoEngine.ctx.font = 'bold 64px Arial';
  videoEngine.ctx.textAlign = 'center';
  videoEngine.ctx.fillText(productName, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2);

  videoEngine.ctx.font = '32px Arial';
  videoEngine.ctx.fillText(description, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 + 80);
}

function renderSocialPostTemplate() {
  videoEngine.ctx.fillStyle = '#ffffff';
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const message = state.templateParams.message || 'Check this out!';
  const hashtag = state.templateParams.hashtag || '#awesome';

  videoEngine.ctx.fillStyle = '#1a1a2e';
  videoEngine.ctx.font = 'bold 48px Arial';
  videoEngine.ctx.textAlign = 'center';
  videoEngine.ctx.fillText(message, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 - 40);

  videoEngine.ctx.fillStyle = '#667eea';
  videoEngine.ctx.font = 'bold 36px Arial';
  videoEngine.ctx.fillText(hashtag, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 + 40);
}

function renderEventAnnouncementTemplate() {
  const gradient = videoEngine.ctx.createRadialGradient(
    videoEngine.canvas.width / 2, videoEngine.canvas.height / 2, 0,
    videoEngine.canvas.width / 2, videoEngine.canvas.height / 2, videoEngine.canvas.width / 2
  );
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#4ecdc4');
  videoEngine.ctx.fillStyle = gradient;
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const eventName = state.templateParams.eventName || 'Big Event';
  const date = state.templateParams.date || 'December 31, 2024';
  const time = state.templateParams.time || '7:00 PM';

  videoEngine.ctx.fillStyle = '#ffffff';
  videoEngine.ctx.font = 'bold 64px Arial';
  videoEngine.ctx.textAlign = 'center';
  videoEngine.ctx.fillText(eventName, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 - 80);

  videoEngine.ctx.font = '36px Arial';
  videoEngine.ctx.fillText(date, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 + 20);
  videoEngine.ctx.fillText(time, videoEngine.canvas.width / 2, videoEngine.canvas.height / 2 + 70);
}

function renderQuoteVideoTemplate() {
  videoEngine.ctx.fillStyle = '#2c3e50';
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const quote = state.templateParams.quote || 'Be the change you wish to see';
  const author = state.templateParams.author || 'Anonymous';

  // Decorative quotes
  videoEngine.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  videoEngine.ctx.font = 'bold 120px Georgia';
  videoEngine.ctx.fillText('"', videoEngine.canvas.width / 2 - 200, 200);
  videoEngine.ctx.fillText('"', videoEngine.canvas.width / 2 + 200, videoEngine.canvas.height - 100);

  videoEngine.ctx.fillStyle = '#ffffff';
  videoEngine.ctx.font = 'italic 42px Georgia';
  videoEngine.ctx.textAlign = 'center';

  // Word wrap for quote
  const words = quote.split(' ');
  let line = '';
  let y = videoEngine.canvas.height / 2 - 40;
  const maxWidth = videoEngine.canvas.width - 200;

  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = videoEngine.ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== '') {
      videoEngine.ctx.fillText(line, videoEngine.canvas.width / 2, y);
      line = word + ' ';
      y += 50;
    } else {
      line = testLine;
    }
  }
  videoEngine.ctx.fillText(line, videoEngine.canvas.width / 2, y);

  videoEngine.ctx.font = '28px Georgia';
  videoEngine.ctx.fillText(`- ${author}`, videoEngine.canvas.width / 2, y + 60);
}

// Render visualization preview
function renderVisualizationPreview() {
  videoEngine.clear();
  videoEngine.ctx.fillStyle = state.bgColor;
  videoEngine.ctx.fillRect(0, 0, videoEngine.canvas.width, videoEngine.canvas.height);

  const progress = 1; // Show fully rendered for preview
  const options = {
    color: state.vizColor,
    animated: state.vizAnimated
  };

  switch (state.vizType) {
    case 'bar-chart':
      videoEngine.drawBarChart(state.vizData, progress, options);
      break;
    case 'line-graph':
      videoEngine.drawLineGraph(state.vizData, progress, options);
      break;
    case 'pie-chart':
      videoEngine.drawPieChart(state.vizData, progress, options);
      break;
    case 'particles':
      videoEngine.drawParticles(progress, options);
      break;
    case 'waveform':
      videoEngine.drawWaveform(progress, options);
      break;
    case 'spiral':
      videoEngine.drawSpiral(progress, options);
      break;
    case 'matrix':
      videoEngine.drawMatrixRain(progress, options);
      break;
  }
}

// Calculate total duration
function calculateTotalDuration() {
  switch (state.mode) {
    case 'slideshow':
      const slideTime = state.frameDuration + state.transitionDuration;
      state.totalDuration = state.images.length * slideTime;
      break;
    case 'text-animation':
      state.totalDuration = state.textDuration;
      break;
    case 'template':
      state.totalDuration = 5; // Default template duration
      break;
    case 'visualization':
      state.totalDuration = state.vizDuration;
      break;
  }
}

// Update timeline display
function updateTimelineDisplay() {
  document.getElementById('currentTime').textContent = formatTime(state.currentTime);
  document.getElementById('totalTime').textContent = formatTime(state.totalDuration);
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Play preview
function playPreview() {
  if (state.isPlaying) return;

  state.isPlaying = true;
  state.currentTime = 0;

  previewInterval = setInterval(() => {
    state.currentTime += 1 / 30; // 30fps preview

    if (state.currentTime >= state.totalDuration) {
      stopPreview();
      return;
    }

    updatePreviewFrame();
    updateTimelineDisplay();

    const progress = (state.currentTime / state.totalDuration) * 100;
    document.getElementById('timelineSlider').value = progress;
  }, 1000 / 30);
}

// Pause preview
function pausePreview() {
  state.isPlaying = false;
  if (previewInterval) {
    clearInterval(previewInterval);
  }
}

// Stop preview
function stopPreview() {
  pausePreview();
  state.currentTime = 0;
  updatePreviewFrame();
  updateTimelineDisplay();
  document.getElementById('timelineSlider').value = 0;
}

// Update preview frame based on current time
function updatePreviewFrame() {
  // This would render the frame at the current time
  // For now, just update the preview
  updatePreview();
}

// Generate video
async function generateVideo() {
  const savePath = await ipcRenderer.invoke('save-video', `video.${state.exportFormat}`);

  if (!savePath) return;

  showProgress(true);
  updateProgress(0, 'Initializing...');

  try {
    // Parse resolution
    const [width, height] = state.exportResolution.split('x').map(v => parseInt(v));

    // Create a temporary canvas for rendering
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;
    const renderEngine = new VideoEngine(renderCanvas);

    // Generate frames
    const totalFrames = Math.floor(state.totalDuration * state.exportFPS);
    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      const progress = i / totalFrames;
      const time = progress * state.totalDuration;

      updateProgress((i / totalFrames) * 50, `Rendering frame ${i + 1}/${totalFrames}...`);

      // Render frame based on mode
      await renderFrameAtTime(renderEngine, time);

      // Capture frame as data URL
      frames.push(renderCanvas.toDataURL('image/png'));
    }

    updateProgress(50, 'Encoding video...');

    // In a real implementation, you would use FFmpeg or similar to encode the video
    // For this demo, we'll simulate the encoding process
    await simulateEncoding(frames, savePath);

    updateProgress(100, 'Video generated successfully!');

    setTimeout(() => {
      showProgress(false);
      ipcRenderer.invoke('show-message', {
        type: 'info',
        title: 'Success',
        message: `Video saved to:\n${savePath}`
      });
    }, 1000);

  } catch (error) {
    console.error('Error generating video:', error);
    showProgress(false);
    ipcRenderer.invoke('show-message', {
      type: 'error',
      title: 'Error',
      message: `Failed to generate video:\n${error.message}`
    });
  }
}

// Render frame at specific time
async function renderFrameAtTime(engine, time) {
  switch (state.mode) {
    case 'slideshow':
      await renderSlideshowFrame(engine, time);
      break;
    case 'text-animation':
      renderTextAnimationFrame(engine, time);
      break;
    case 'template':
      renderTemplateFrame(engine, time);
      break;
    case 'visualization':
      renderVisualizationFrame(engine, time);
      break;
  }
}

// Render slideshow frame
async function renderSlideshowFrame(engine, time) {
  const slideTime = state.frameDuration + state.transitionDuration;
  const slideIndex = Math.floor(time / slideTime);
  const timeInSlide = time % slideTime;

  if (slideIndex >= state.images.length) return;

  const img1 = await loadImage(state.images[slideIndex].dataUrl);

  if (timeInSlide < state.frameDuration) {
    // Show current image
    engine.clear();
    engine.drawImage(img1);
  } else if (slideIndex < state.images.length - 1) {
    // Transition to next image
    const img2 = await loadImage(state.images[slideIndex + 1].dataUrl);
    const transitionProgress = (timeInSlide - state.frameDuration) / state.transitionDuration;
    engine.applyTransition(img1, img2, transitionProgress, state.transition);
  }
}

// Render text animation frame
function renderTextAnimationFrame(engine, time) {
  const progress = Math.min(time / state.textDuration, 1);

  engine.clear();
  engine.ctx.fillStyle = state.bgColor;
  engine.ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

  const options = {
    font: `${state.textSize}px ${state.textFont}`,
    color: state.textColor,
    x: engine.canvas.width / 2,
    y: engine.canvas.height / 2
  };

  switch (state.textAnimation) {
    case 'fade-in':
      engine.animateTextFadeIn(state.textContent, progress, options);
      break;
    case 'slide-in-left':
      engine.animateTextSlideIn(state.textContent, progress, 'left', options);
      break;
    case 'slide-in-right':
      engine.animateTextSlideIn(state.textContent, progress, 'right', options);
      break;
    case 'slide-in-top':
      engine.animateTextSlideIn(state.textContent, progress, 'top', options);
      break;
    case 'slide-in-bottom':
      engine.animateTextSlideIn(state.textContent, progress, 'bottom', options);
      break;
    case 'typewriter':
      engine.animateTextTypewriter(state.textContent, progress, options);
      break;
    case 'scale-in':
      engine.animateTextScaleIn(state.textContent, progress, options);
      break;
    case 'rotate-in':
      engine.animateTextRotateIn(state.textContent, progress, options);
      break;
    case 'bounce':
      engine.animateTextBounce(state.textContent, progress, options);
      break;
  }
}

// Render template frame (simplified)
function renderTemplateFrame(engine, time) {
  // Render the selected template
  // This is a simplified version; real implementation would be more complex
  renderTemplatePreview();
}

// Render visualization frame
function renderVisualizationFrame(engine, time) {
  const progress = state.vizAnimated ? Math.min(time / state.vizDuration, 1) : 1;

  engine.clear();
  engine.ctx.fillStyle = state.bgColor;
  engine.ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

  const options = {
    color: state.vizColor,
    animated: state.vizAnimated
  };

  switch (state.vizType) {
    case 'bar-chart':
      engine.drawBarChart(state.vizData, progress, options);
      break;
    case 'line-graph':
      engine.drawLineGraph(state.vizData, progress, options);
      break;
    case 'pie-chart':
      engine.drawPieChart(state.vizData, progress, options);
      break;
    case 'particles':
      engine.drawParticles(progress, options);
      break;
    case 'waveform':
      engine.drawWaveform(progress, options);
      break;
    case 'spiral':
      engine.drawSpiral(progress, options);
      break;
    case 'matrix':
      engine.drawMatrixRain(progress, options);
      break;
  }
}

// Helper: Load image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Simulate video encoding (placeholder)
async function simulateEncoding(frames, outputPath) {
  // In a real implementation, this would use FFmpeg via Node.js child_process
  // to encode frames into a video file

  // For now, we'll just simulate the process with a delay
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Would encode ${frames.length} frames to ${outputPath}`);
      resolve();
    }, 2000);
  });
}

// Show/hide progress
function showProgress(show) {
  const progressSection = document.getElementById('progressSection');
  if (show) {
    progressSection.classList.remove('hidden');
  } else {
    progressSection.classList.add('hidden');
  }
}

// Update progress
function updateProgress(percentage, message) {
  document.getElementById('progressFill').style.width = `${percentage}%`;
  document.getElementById('progressText').textContent = message;
}

// Save project
async function saveProject() {
  const result = await ipcRenderer.invoke('save-project', state);
  if (result) {
    ipcRenderer.invoke('show-message', {
      type: 'info',
      title: 'Success',
      message: 'Project saved successfully!'
    });
  }
}

// Open project
async function openProject() {
  const project = await ipcRenderer.invoke('open-project');
  if (project) {
    Object.assign(state, project);

    // Update UI
    document.querySelector(`.mode-btn[data-mode="${state.mode}"]`).click();

    // Update all form fields
    if (state.mode === 'slideshow') {
      document.getElementById('frameDuration').value = state.frameDuration;
      document.getElementById('transition').value = state.transition;
      document.getElementById('transitionDuration').value = state.transitionDuration;
      updateImageList();
    } else if (state.mode === 'text-animation') {
      document.getElementById('textContent').value = state.textContent;
      document.getElementById('textAnimation').value = state.textAnimation;
      document.getElementById('textFont').value = state.textFont;
      document.getElementById('textSize').value = state.textSize;
      document.getElementById('textColor').value = state.textColor;
      document.getElementById('bgColor').value = state.bgColor;
      document.getElementById('textDuration').value = state.textDuration;
    } else if (state.mode === 'visualization') {
      document.getElementById('vizType').value = state.vizType;
      document.getElementById('vizData').value = state.vizData.join(',');
      document.getElementById('vizColor').value = state.vizColor;
      document.getElementById('vizDuration').value = state.vizDuration;
      document.getElementById('vizAnimated').checked = state.vizAnimated;
    }

    updatePreview();

    ipcRenderer.invoke('show-message', {
      type: 'info',
      title: 'Success',
      message: 'Project loaded successfully!'
    });
  }
}
