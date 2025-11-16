class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = null;
    this.source = null;
    this.analyser = null;
    this.gainNode = null;
    this.eqNodes = [];
    this.isInitialized = false;
  }

  init(audioElement) {
    if (this.isInitialized) return;

    this.audioElement = audioElement;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 創建音頻源
    this.source = this.audioContext.createMediaElementSource(audioElement);

    // 創建分析器
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    // 創建增益節點(音量控制)
    this.gainNode = this.audioContext.createGain();

    // 創建 10 段均衡器
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    frequencies.forEach(freq => {
      const eq = this.audioContext.createBiquadFilter();
      eq.type = 'peaking';
      eq.frequency.value = freq;
      eq.Q.value = 1;
      eq.gain.value = 0;
      this.eqNodes.push(eq);
    });

    // 連接音頻節點
    let previousNode = this.source;

    // 連接均衡器
    this.eqNodes.forEach(eq => {
      previousNode.connect(eq);
      previousNode = eq;
    });

    // 連接分析器和增益
    previousNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.isInitialized = true;
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  setEQ(index, value) {
    if (this.eqNodes[index]) {
      this.eqNodes[index].gain.value = value;
    }
  }

  resetEQ() {
    this.eqNodes.forEach(node => {
      node.gain.value = 0;
    });
  }

  applyEQPreset(preset) {
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rock: [5, 4, 3, 1, -1, 0, 1, 3, 4, 5],
      classical: [-1, -1, -1, 0, 0, 0, 1, 2, 2, 2],
      jazz: [4, 3, 2, 1, -1, -1, 0, 1, 3, 4],
      pop: [-1, -1, 0, 2, 4, 4, 2, 0, -1, -1],
      bass: [8, 7, 6, 4, 2, 0, 0, 0, 0, 0],
      vocal: [-2, -1, 0, 1, 3, 3, 2, 1, 0, -1]
    };

    const values = presets[preset] || presets.flat;
    values.forEach((value, index) => {
      this.setEQ(index, value);
    });
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
