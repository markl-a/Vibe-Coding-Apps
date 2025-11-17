const { ipcRenderer } = require('electron');
const Tone = require('tone');
const MusicEngine = require('./musicEngine');

/**
 * 音乐生成器渲染进程
 */
class MusicGenerator {
  constructor() {
    this.engine = new MusicEngine();
    this.synth = null;
    this.polySynth = null;
    this.drums = {};
    this.currentSequence = null;
    this.isPlaying = false;
    this.recorder = null;
    this.recordedChunks = [];

    // 当前生成的音乐
    this.currentComposition = null;

    // 可视化
    this.waveform = null;
    this.fft = null;
    this.canvasContext = null;
    this.animationId = null;

    this.init();
  }

  async init() {
    // 初始化 Tone.js
    await Tone.start();
    console.log('Tone.js started');

    // 创建合成器
    this.createSynthesizers();

    // 创建分析器
    this.createAnalyzers();

    // 绑定事件
    this.bindEvents();

    // 初始化画布
    this.initCanvas();

    // 更新UI
    this.updateUI();
  }

  createSynthesizers() {
    // 主旋律合成器
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();

    // 和弦合成器
    this.polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 1.5
      },
      volume: -10
    }).toDestination();

    // 鼓组
    this.drums = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }).toDestination(),

      snare: new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0
        }
      }).toDestination(),

      hihat: new Tone.MetalSynth({
        frequency: 200,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        volume: -20
      }).toDestination()
    };
  }

  createAnalyzers() {
    // 波形分析器
    this.waveform = new Tone.Waveform(1024);
    Tone.Destination.connect(this.waveform);

    // FFT 分析器（频谱）
    this.fft = new Tone.FFT(512);
    Tone.Destination.connect(this.fft);
  }

  bindEvents() {
    // 生成按钮
    document.getElementById('generateBtn').addEventListener('click', () => {
      this.generateMusic();
    });

    // 播放/停止按钮
    document.getElementById('playBtn').addEventListener('click', () => {
      this.togglePlayback();
    });

    // 停止按钮
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stop();
    });

    // 导出按钮
    document.getElementById('exportWavBtn').addEventListener('click', () => {
      this.exportWAV();
    });

    document.getElementById('exportMidiBtn').addEventListener('click', () => {
      this.exportMIDI();
    });

    // 参数变化
    document.getElementById('bpm').addEventListener('input', (e) => {
      const value = e.target.value;
      document.getElementById('bpmValue').textContent = value;
      Tone.Transport.bpm.value = parseInt(value);
    });

    document.getElementById('bars').addEventListener('input', (e) => {
      document.getElementById('barsValue').textContent = e.target.value;
    });

    // 音色选择
    document.getElementById('timbre').addEventListener('change', (e) => {
      this.changeTimbre(e.target.value);
    });

    // 可视化模式切换
    document.querySelectorAll('input[name="vizMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        // 可视化模式已在 draw 函数中处理
      });
    });
  }

  initCanvas() {
    const canvas = document.getElementById('visualizer');
    this.canvasContext = canvas.getContext('2d');

    // 设置画布大小
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 开始绘制
    this.draw();
  }

  generateMusic() {
    const mode = document.getElementById('mode').value;
    const scale = document.getElementById('scale').value;
    const bpm = parseInt(document.getElementById('bpm').value);
    const bars = parseInt(document.getElementById('bars').value);

    // 停止当前播放
    this.stop();

    // 生成音乐
    let composition;

    switch (mode) {
      case 'random':
        composition = {
          melody: this.engine.generateRandomMelody({
            scale: scale,
            length: bars * 8,
            rootNote: 60
          }),
          chords: [],
          rhythm: {},
          bpm: bpm
        };
        break;

      case 'markov':
        composition = {
          melody: this.engine.generateMarkovMelody({
            scale: scale,
            length: bars * 8,
            rootNote: 60
          }),
          chords: [],
          rhythm: {},
          bpm: bpm
        };
        break;

      case 'chord':
        const style = document.getElementById('chordStyle')?.value || 'pop';
        composition = {
          melody: [],
          chords: this.engine.generateChordProgression({
            type: style,
            rootNote: 48,
            bars: bars
          }),
          rhythm: {},
          bpm: bpm
        };
        break;

      case 'rhythm':
        const pattern = document.getElementById('rhythmPattern')?.value || 'straight';
        composition = {
          melody: [],
          chords: [],
          rhythm: this.engine.generateRhythm({
            pattern: pattern,
            length: bars * 16
          }),
          bpm: bpm
        };
        break;

      case 'full':
        const fullStyle = document.getElementById('fullStyle')?.value || 'pop';
        composition = this.engine.generateFullComposition({
          scale: scale,
          bpm: bpm,
          bars: bars,
          style: fullStyle
        });
        break;

      default:
        composition = this.engine.generateFullComposition({
          scale: scale,
          bpm: bpm,
          bars: bars
        });
    }

    this.currentComposition = composition;

    // 显示生成的音符
    this.displayNotes(composition);

    // 更新状态
    this.updateStatus('Music generated! Click Play to listen.');
  }

  async togglePlayback() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  async play() {
    if (!this.currentComposition) {
      this.updateStatus('Please generate music first!');
      return;
    }

    this.isPlaying = true;
    document.getElementById('playBtn').innerHTML = '<span class="icon">⏸</span>Pause';

    // 设置 BPM
    Tone.Transport.bpm.value = this.currentComposition.bpm || 120;

    // 清除之前的序列
    Tone.Transport.cancel();

    // 调度旋律
    if (this.currentComposition.melody && this.currentComposition.melody.length > 0) {
      const melodyPart = new Tone.Part((time, note) => {
        if (note.note) {
          this.synth.triggerAttackRelease(
            note.note,
            note.duration || '8n',
            time,
            note.velocity || 0.8
          );
        }
      }, this.currentComposition.melody.map(n => [n.time, n]));

      melodyPart.start(0);
    }

    // 调度和弦
    if (this.currentComposition.chords && this.currentComposition.chords.length > 0) {
      const chordPart = new Tone.Part((time, chord) => {
        this.polySynth.triggerAttackRelease(
          chord.notes,
          chord.duration || '2n',
          time,
          chord.velocity || 0.5
        );
      }, this.currentComposition.chords.map(c => [c.time, c]));

      chordPart.start(0);
    }

    // 调度节奏
    if (this.currentComposition.rhythm) {
      Object.keys(this.currentComposition.rhythm).forEach(instrument => {
        const hits = this.currentComposition.rhythm[instrument];
        if (hits && hits.length > 0 && this.drums[instrument]) {
          const drumPart = new Tone.Part((time, hit) => {
            if (instrument === 'kick') {
              this.drums[instrument].triggerAttackRelease('C1', '8n', time, hit.velocity);
            } else {
              this.drums[instrument].triggerAttackRelease('8n', time, hit.velocity);
            }
          }, hits.map(h => [h.time, h]));

          drumPart.start(0);
        }
      });
    }

    // 启动传输
    Tone.Transport.start();

    this.updateStatus('Playing...');
  }

  pause() {
    this.isPlaying = false;
    Tone.Transport.pause();
    document.getElementById('playBtn').innerHTML = '<span class="icon">▶</span>Play';
    this.updateStatus('Paused');
  }

  stop() {
    this.isPlaying = false;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    document.getElementById('playBtn').innerHTML = '<span class="icon">▶</span>Play';
    this.updateStatus('Stopped');
  }

  changeTimbre(timbre) {
    let oscillatorType = 'triangle';

    switch (timbre) {
      case 'piano':
        oscillatorType = 'triangle';
        this.synth.set({
          oscillator: { type: oscillatorType },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
        });
        break;
      case 'organ':
        oscillatorType = 'sine';
        this.synth.set({
          oscillator: { type: oscillatorType },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.5 }
        });
        break;
      case 'synth':
        oscillatorType = 'sawtooth';
        this.synth.set({
          oscillator: { type: oscillatorType },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1.5 }
        });
        break;
      case 'bell':
        oscillatorType = 'sine';
        this.synth.set({
          oscillator: { type: oscillatorType },
          envelope: { attack: 0.001, decay: 1, sustain: 0, release: 1.5 }
        });
        break;
    }
  }

  displayNotes(composition) {
    const container = document.getElementById('noteSequence');
    container.innerHTML = '';

    // 显示旋律
    if (composition.melody && composition.melody.length > 0) {
      const melodyDiv = document.createElement('div');
      melodyDiv.className = 'note-track';
      melodyDiv.innerHTML = '<h4>Melody</h4>';

      const notes = composition.melody.slice(0, 32).map(n =>
        `<span class="note-item">${n.note || 'rest'}</span>`
      ).join('');

      melodyDiv.innerHTML += `<div class="notes">${notes}</div>`;
      container.appendChild(melodyDiv);
    }

    // 显示和弦
    if (composition.chords && composition.chords.length > 0) {
      const chordDiv = document.createElement('div');
      chordDiv.className = 'note-track';
      chordDiv.innerHTML = '<h4>Chords</h4>';

      const chords = composition.chords.map(c =>
        `<span class="chord-item">${c.notes.join(', ')}</span>`
      ).join('');

      chordDiv.innerHTML += `<div class="notes">${chords}</div>`;
      container.appendChild(chordDiv);
    }

    // 显示节奏
    if (composition.rhythm && Object.keys(composition.rhythm).length > 0) {
      const rhythmDiv = document.createElement('div');
      rhythmDiv.className = 'note-track';
      rhythmDiv.innerHTML = '<h4>Rhythm</h4>';

      Object.keys(composition.rhythm).forEach(instrument => {
        const hits = composition.rhythm[instrument];
        rhythmDiv.innerHTML += `<div class="rhythm-line">
          <strong>${instrument}:</strong> ${hits.length} hits
        </div>`;
      });

      container.appendChild(rhythmDiv);
    }
  }

  draw() {
    this.animationId = requestAnimationFrame(() => this.draw());

    if (!this.canvasContext) return;

    const ctx = this.canvasContext;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // 清除画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // 获取可视化模式
    const vizMode = document.querySelector('input[name="vizMode"]:checked')?.value || 'waveform';

    if (vizMode === 'waveform') {
      this.drawWaveform(ctx, width, height);
    } else {
      this.drawSpectrum(ctx, width, height);
    }
  }

  drawWaveform(ctx, width, height) {
    const values = this.waveform.getValue();
    const sliceWidth = width / values.length;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ffff';
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const y = ((v + 1) / 2) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }

  drawSpectrum(ctx, width, height) {
    const values = this.fft.getValue();
    const barWidth = width / values.length;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const percent = (value + 140) / 140; // 归一化
      const barHeight = Math.max(0, percent * height);

      // 渐变色
      const hue = (i / values.length) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
  }

  async exportWAV() {
    if (!this.currentComposition) {
      this.updateStatus('Please generate music first!');
      return;
    }

    try {
      this.updateStatus('Rendering audio...');

      // 创建离线上下文进行渲染
      const duration = this.calculateDuration(this.currentComposition);
      const offline = new Tone.Offline(() => {
        // 重新播放音乐到离线上下文
        this.renderComposition(this.currentComposition);
      }, duration);

      const buffer = await offline;

      // 转换为 WAV
      const wav = this.bufferToWave(buffer._buffer, buffer._buffer.length);

      // 保存文件
      const result = await ipcRenderer.invoke('save-file-dialog', {
        title: 'Export WAV',
        defaultPath: 'music.wav',
        filters: [{ name: 'WAV Audio', extensions: ['wav'] }]
      });

      if (!result.canceled) {
        // 转换为 base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result;
          await ipcRenderer.invoke('save-file', result.filePath, base64, 'base64');
          this.updateStatus('WAV exported successfully!');
        };
        reader.readAsDataURL(wav);
      }
    } catch (error) {
      console.error('Export error:', error);
      this.updateStatus('Export failed: ' + error.message);
    }
  }

  async exportMIDI() {
    if (!this.currentComposition) {
      this.updateStatus('Please generate music first!');
      return;
    }

    try {
      const midiData = this.compositionToMIDI(this.currentComposition);

      const result = await ipcRenderer.invoke('save-file-dialog', {
        title: 'Export MIDI',
        defaultPath: 'music.mid',
        filters: [{ name: 'MIDI File', extensions: ['mid', 'midi'] }]
      });

      if (!result.canceled) {
        await ipcRenderer.invoke('save-file', result.filePath, midiData, 'binary');
        this.updateStatus('MIDI exported successfully!');
      }
    } catch (error) {
      console.error('MIDI export error:', error);
      this.updateStatus('MIDI export failed: ' + error.message);
    }
  }

  renderComposition(composition) {
    // 渲染旋律
    if (composition.melody) {
      composition.melody.forEach(note => {
        if (note.note) {
          this.synth.triggerAttackRelease(
            note.note,
            note.duration || '8n',
            note.time,
            note.velocity || 0.8
          );
        }
      });
    }

    // 渲染和弦
    if (composition.chords) {
      composition.chords.forEach(chord => {
        this.polySynth.triggerAttackRelease(
          chord.notes,
          chord.duration || '2n',
          chord.time,
          chord.velocity || 0.5
        );
      });
    }
  }

  calculateDuration(composition) {
    let maxTime = 0;

    if (composition.melody) {
      const lastNote = composition.melody[composition.melody.length - 1];
      if (lastNote) {
        maxTime = Math.max(maxTime, lastNote.time + 2);
      }
    }

    if (composition.chords) {
      const lastChord = composition.chords[composition.chords.length - 1];
      if (lastChord) {
        maxTime = Math.max(maxTime, lastChord.time + 4);
      }
    }

    return Math.max(maxTime, 8); // 至少 8 秒
  }

  bufferToWave(audioBuffer, len) {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // 写入 WAV 头
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // "RIFF" chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // "fmt " sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(audioBuffer.sampleRate);
    setUint32(audioBuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    // "data" sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    // 写入交错的样本
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  compositionToMIDI(composition) {
    // 简单的 MIDI 文件生成
    // 这是一个基础实现，实际项目中应该使用专门的 MIDI 库
    const bpm = composition.bpm || 120;

    // 这里返回一个占位符
    // 实际实现需要完整的 MIDI 文件格式
    return `MIDI export not fully implemented yet. BPM: ${bpm}`;
  }

  updateStatus(message) {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
      status.style.opacity = '1';

      setTimeout(() => {
        status.style.opacity = '0.7';
      }, 2000);
    }
  }

  updateUI() {
    // 初始化 UI 状态
    document.getElementById('bpmValue').textContent =
      document.getElementById('bpm').value;
    document.getElementById('barsValue').textContent =
      document.getElementById('bars').value;
  }
}

// 初始化应用
let musicGenerator;

document.addEventListener('DOMContentLoaded', () => {
  musicGenerator = new MusicGenerator();
});
