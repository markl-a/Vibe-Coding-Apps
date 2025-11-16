class Visualizer {
  constructor(canvas, audioEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioEngine = audioEngine;
    this.animationId = null;
    this.mode = 'bars'; // 'bars' or 'waveform'
  }

  start() {
    if (this.animationId) return;
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clear();
  }

  setMode(mode) {
    this.mode = mode;
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.mode === 'bars') {
      this.drawBars();
    } else {
      this.drawWaveform();
    }
  }

  drawBars() {
    const frequencyData = this.audioEngine.getFrequencyData();
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const barCount = 64;
    const barWidth = width / barCount;
    const step = Math.floor(frequencyData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i * step];
      const barHeight = (value / 255) * height;

      // 漸層色彩
      const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, '#00d4ff');
      gradient.addColorStop(0.5, '#7b2ff7');
      gradient.addColorStop(1, '#f107a3');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 2,
        barHeight
      );
    }
  }

  drawWaveform() {
    const waveformData = this.audioEngine.getWaveformData();
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#00d4ff';
    this.ctx.beginPath();

    const sliceWidth = width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }
}
