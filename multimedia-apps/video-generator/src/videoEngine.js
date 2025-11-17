/**
 * Video Generation Engine
 * Handles video rendering, transitions, effects, and templates
 */

class VideoEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.fps = 30;
    this.animationFrameId = null;
  }

  // Set canvas resolution
  setResolution(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // Clear canvas
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw image to canvas with fit options
  drawImage(img, options = {}) {
    const {
      x = 0,
      y = 0,
      width = this.canvas.width,
      height = this.canvas.height,
      fit = 'cover', // 'cover', 'contain', 'fill', 'none'
      opacity = 1
    } = options;

    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, drawX, drawY;

    if (fit === 'cover') {
      if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = drawHeight * imgRatio;
        drawX = x + (width - drawWidth) / 2;
        drawY = y;
      } else {
        drawWidth = width;
        drawHeight = drawWidth / imgRatio;
        drawX = x;
        drawY = y + (height - drawHeight) / 2;
      }
    } else if (fit === 'contain') {
      if (imgRatio > canvasRatio) {
        drawWidth = width;
        drawHeight = drawWidth / imgRatio;
        drawX = x;
        drawY = y + (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = drawHeight * imgRatio;
        drawX = x + (width - drawWidth) / 2;
        drawY = y;
      }
    } else if (fit === 'fill') {
      drawX = x;
      drawY = y;
      drawWidth = width;
      drawHeight = height;
    } else {
      drawX = x;
      drawY = y;
      drawWidth = img.width;
      drawHeight = img.height;
    }

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
  }

  // Apply transition effect between two images
  applyTransition(img1, img2, progress, transitionType) {
    this.clear();

    switch (transitionType) {
      case 'fade':
        this.transitionFade(img1, img2, progress);
        break;
      case 'slide-left':
        this.transitionSlide(img1, img2, progress, 'left');
        break;
      case 'slide-right':
        this.transitionSlide(img1, img2, progress, 'right');
        break;
      case 'slide-up':
        this.transitionSlide(img1, img2, progress, 'up');
        break;
      case 'slide-down':
        this.transitionSlide(img1, img2, progress, 'down');
        break;
      case 'zoom-in':
        this.transitionZoom(img1, img2, progress, 'in');
        break;
      case 'zoom-out':
        this.transitionZoom(img1, img2, progress, 'out');
        break;
      case 'wipe-left':
        this.transitionWipe(img1, img2, progress, 'left');
        break;
      case 'wipe-right':
        this.transitionWipe(img1, img2, progress, 'right');
        break;
      case 'circle-expand':
        this.transitionCircleExpand(img1, img2, progress);
        break;
      case 'dissolve':
        this.transitionDissolve(img1, img2, progress);
        break;
      default:
        this.drawImage(progress < 0.5 ? img1 : img2);
    }
  }

  // Transition: Fade
  transitionFade(img1, img2, progress) {
    this.drawImage(img1, { opacity: 1 - progress });
    this.drawImage(img2, { opacity: progress });
  }

  // Transition: Slide
  transitionSlide(img1, img2, progress, direction) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    switch (direction) {
      case 'left':
        x1 = -w * progress;
        x2 = w * (1 - progress);
        break;
      case 'right':
        x1 = w * progress;
        x2 = -w * (1 - progress);
        break;
      case 'up':
        y1 = -h * progress;
        y2 = h * (1 - progress);
        break;
      case 'down':
        y1 = h * progress;
        y2 = -h * (1 - progress);
        break;
    }

    this.ctx.save();
    this.ctx.translate(x1, y1);
    this.drawImage(img1);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(x2, y2);
    this.drawImage(img2);
    this.ctx.restore();
  }

  // Transition: Zoom
  transitionZoom(img1, img2, progress, direction) {
    const scale1 = direction === 'in' ? 1 - progress * 0.3 : 1 + progress * 0.5;
    const scale2 = direction === 'in' ? 0.7 + progress * 0.3 : 0.5 + progress * 0.5;

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(scale1, scale1);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.drawImage(img1, { opacity: 1 - progress });
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(scale2, scale2);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.drawImage(img2, { opacity: progress });
    this.ctx.restore();
  }

  // Transition: Wipe
  transitionWipe(img1, img2, progress, direction) {
    this.drawImage(img1);

    this.ctx.save();
    this.ctx.beginPath();

    if (direction === 'left') {
      this.ctx.rect(0, 0, this.canvas.width * progress, this.canvas.height);
    } else {
      this.ctx.rect(this.canvas.width * (1 - progress), 0, this.canvas.width * progress, this.canvas.height);
    }

    this.ctx.clip();
    this.drawImage(img2);
    this.ctx.restore();
  }

  // Transition: Circle Expand
  transitionCircleExpand(img1, img2, progress) {
    this.drawImage(img1);

    const maxRadius = Math.sqrt(
      Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)
    ) / 2;
    const radius = maxRadius * progress;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvas.width / 2,
      this.canvas.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    this.ctx.clip();
    this.drawImage(img2);
    this.ctx.restore();
  }

  // Transition: Dissolve
  transitionDissolve(img1, img2, progress) {
    this.drawImage(img1);

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(this.canvas, 0, 0);
    const data1 = tempCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawImage(img2);
    this.ctx.restore();
    const data2 = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < data1.data.length; i += 4) {
      const random = Math.random();
      if (random < progress) {
        imageData.data[i] = data2.data[i];
        imageData.data[i + 1] = data2.data[i + 1];
        imageData.data[i + 2] = data2.data[i + 2];
        imageData.data[i + 3] = data2.data[i + 3];
      } else {
        imageData.data[i] = data1.data[i];
        imageData.data[i + 1] = data1.data[i + 1];
        imageData.data[i + 2] = data1.data[i + 2];
        imageData.data[i + 3] = data1.data[i + 3];
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // Text Animation: Fade In
  animateTextFadeIn(text, progress, options) {
    const { font, color, x, y } = options;
    this.ctx.save();
    this.ctx.globalAlpha = progress;
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  // Text Animation: Slide In
  animateTextSlideIn(text, progress, direction, options) {
    const { font, color, x, y } = options;
    let offsetX = 0, offsetY = 0;

    switch (direction) {
      case 'left':
        offsetX = -this.canvas.width * (1 - progress);
        break;
      case 'right':
        offsetX = this.canvas.width * (1 - progress);
        break;
      case 'top':
        offsetY = -this.canvas.height * (1 - progress);
        break;
      case 'bottom':
        offsetY = this.canvas.height * (1 - progress);
        break;
    }

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + offsetX, y + offsetY);
    this.ctx.restore();
  }

  // Text Animation: Typewriter
  animateTextTypewriter(text, progress, options) {
    const { font, color, x, y } = options;
    const charCount = Math.floor(text.length * progress);
    const displayText = text.substring(0, charCount);

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(displayText, x, y);
    this.ctx.restore();
  }

  // Text Animation: Scale In
  animateTextScaleIn(text, progress, options) {
    const { font, color, x, y } = options;
    const scale = progress;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  }

  // Text Animation: Rotate In
  animateTextRotateIn(text, progress, options) {
    const { font, color, x, y } = options;
    const rotation = (1 - progress) * Math.PI * 2;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.globalAlpha = progress;
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  }

  // Text Animation: Bounce
  animateTextBounce(text, progress, options) {
    const { font, color, x, y } = options;
    const bounce = Math.abs(Math.sin(progress * Math.PI * 4)) * 50 * (1 - progress);

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y - bounce);
    this.ctx.restore();
  }

  // Visualization: Bar Chart
  drawBarChart(data, progress, options) {
    const { color, animated } = options;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = 40;
    const barWidth = (w - padding * 2) / data.length;
    const maxValue = Math.max(...data);

    this.ctx.save();

    data.forEach((value, index) => {
      const barHeight = ((h - padding * 2) * value / maxValue) * (animated ? progress : 1);
      const x = padding + index * barWidth;
      const y = h - padding - barHeight;

      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

      // Value label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(value.toString(), x + barWidth / 2, y - 10);
    });

    this.ctx.restore();
  }

  // Visualization: Line Graph
  drawLineGraph(data, progress, options) {
    const { color, animated } = options;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = 40;
    const segmentWidth = (w - padding * 2) / (data.length - 1);
    const maxValue = Math.max(...data);
    const displayPoints = animated ? Math.floor(data.length * progress) : data.length;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    for (let i = 0; i < displayPoints; i++) {
      const x = padding + i * segmentWidth;
      const y = h - padding - ((h - padding * 2) * data[i] / maxValue);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      // Draw point
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  // Visualization: Pie Chart
  drawPieChart(data, progress, options) {
    const { color } = options;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) / 3;
    const total = data.reduce((a, b) => a + b, 0);

    let currentAngle = -Math.PI / 2;
    const colors = this.generateColors(color, data.length);

    this.ctx.save();

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2 * progress;

      this.ctx.fillStyle = colors[index];
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      this.ctx.closePath();
      this.ctx.fill();

      currentAngle += sliceAngle;
    });

    this.ctx.restore();
  }

  // Visualization: Particles
  drawParticles(progress, options) {
    const { color } = options;
    const particleCount = 100;

    this.ctx.save();

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = progress * Math.min(this.canvas.width, this.canvas.height) / 2;
      const x = this.canvas.width / 2 + Math.cos(angle) * distance;
      const y = this.canvas.height / 2 + Math.sin(angle) * distance;
      const size = 3 + Math.sin(progress * Math.PI * 4 + i) * 2;

      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 1 - progress * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  // Visualization: Waveform
  drawWaveform(progress, options) {
    const { color } = options;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const amplitude = h / 4;
    const frequency = 5;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const y = h / 2 + Math.sin((x / w) * Math.PI * frequency + progress * Math.PI * 2) * amplitude;

      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  // Visualization: Spiral
  drawSpiral(progress, options) {
    const { color } = options;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const steps = 1000;
    for (let i = 0; i < steps * progress; i++) {
      const angle = (i / steps) * Math.PI * 10;
      const radius = (i / steps) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  // Visualization: Matrix Rain
  drawMatrixRain(progress, options) {
    const { color } = options;
    const fontSize = 16;
    const columns = Math.floor(this.canvas.width / fontSize);
    const chars = '01アイウエオカキクケコサシスセソタチツテト';

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = ((progress * 10 + i) % 1) * this.canvas.height;

      this.ctx.globalAlpha = 0.8;
      this.ctx.fillText(char, x, y);
    }

    this.ctx.restore();
  }

  // Helper: Generate color variations
  generateColors(baseColor, count) {
    const colors = [];
    const hue = parseInt(baseColor.slice(1, 3), 16);

    for (let i = 0; i < count; i++) {
      const h = (hue + (360 / count) * i) % 360;
      colors.push(`hsl(${h}, 70%, 60%)`);
    }

    return colors;
  }

  // Helper: Ease functions
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  easeIn(t) {
    return t * t;
  }

  easeOut(t) {
    return t * (2 - t);
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoEngine;
}
