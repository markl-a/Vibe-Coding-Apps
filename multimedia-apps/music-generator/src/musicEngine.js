/**
 * 音乐生成引擎
 * 包含旋律、和弦、节奏生成算法
 */

class MusicEngine {
  constructor() {
    // 音阶定义
    this.scales = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      harmonic_minor: [0, 2, 3, 5, 7, 8, 11]
    };

    // 和弦进行模板
    this.chordProgressions = {
      pop: [[0, 4, 7], [5, 9, 0], [7, 11, 2], [0, 4, 7]], // I-IV-V-I
      jazz: [[0, 4, 7, 11], [5, 9, 0, 4], [7, 11, 2, 5], [0, 4, 7, 11]], // I7-IV7-V7-I7
      blues: [[0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7],
              [5, 9, 0], [5, 9, 0], [0, 4, 7], [0, 4, 7],
              [7, 11, 2], [5, 9, 0], [0, 4, 7], [0, 4, 7]],
      sad: [[0, 3, 7], [5, 8, 0], [3, 7, 10], [0, 3, 7]], // i-iv-VI-i
      ambient: [[0, 7, 12], [2, 9, 14], [4, 11, 16], [0, 7, 12]]
    };

    // 马可夫链转移矩阵
    this.markovChains = {
      simple: {
        0: [0.1, 0.3, 0.4, 0.2, 0, 0, 0], // C
        1: [0.3, 0.1, 0.3, 0.3, 0, 0, 0], // D
        2: [0.2, 0.3, 0.1, 0.2, 0.2, 0, 0], // E
        3: [0.3, 0.2, 0.2, 0.1, 0.2, 0, 0], // F
        4: [0.2, 0.2, 0.2, 0.2, 0.1, 0.1, 0], // G
        5: [0.2, 0.2, 0.2, 0.2, 0.1, 0.1, 0], // A
        6: [0.3, 0.2, 0.2, 0.2, 0.1, 0, 0]  // B
      }
    };

    // 节奏模板
    this.rhythmPatterns = {
      straight: [1, 0, 1, 0, 1, 0, 1, 0],
      syncopated: [1, 0, 0, 1, 0, 1, 0, 0],
      triplet: [1, 0, 0, 1, 0, 0, 1, 0, 0],
      complex: [1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      swing: [1, 0, 0, 1, 0, 1, 0, 0],
      reggae: [0, 0, 1, 0, 0, 0, 1, 0]
    };
  }

  /**
   * 生成随机旋律
   */
  generateRandomMelody(options = {}) {
    const {
      scale = 'major',
      rootNote = 60, // C4
      length = 16,
      octaveRange = 2,
      restProbability = 0.1
    } = options;

    const scaleNotes = this.scales[scale];
    const melody = [];
    const notes = [];

    // 生成可用的音符池
    for (let octave = 0; octave < octaveRange; octave++) {
      scaleNotes.forEach(note => {
        notes.push(rootNote + note + (octave * 12));
      });
    }

    for (let i = 0; i < length; i++) {
      // 随机决定是否为休止符
      if (Math.random() < restProbability) {
        melody.push({
          note: null,
          duration: '8n',
          time: i * 0.5
        });
      } else {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const duration = this.getRandomDuration();
        melody.push({
          note: this.midiToNoteName(note),
          duration: duration,
          time: i * 0.5,
          velocity: 0.6 + Math.random() * 0.3
        });
      }
    }

    return melody;
  }

  /**
   * 使用马可夫链生成旋律
   */
  generateMarkovMelody(options = {}) {
    const {
      scale = 'major',
      rootNote = 60,
      length = 16,
      octaveRange = 1
    } = options;

    const scaleNotes = this.scales[scale];
    const melody = [];

    // 从随机音符开始
    let currentNoteIndex = Math.floor(Math.random() * scaleNotes.length);

    for (let i = 0; i < length; i++) {
      const note = rootNote + scaleNotes[currentNoteIndex];
      const duration = this.getRandomDuration();

      melody.push({
        note: this.midiToNoteName(note),
        duration: duration,
        time: i * 0.5,
        velocity: 0.6 + Math.random() * 0.3
      });

      // 使用马可夫链选择下一个音符
      currentNoteIndex = this.selectNextNote(currentNoteIndex, scaleNotes.length);
    }

    return melody;
  }

  /**
   * 生成和弦进行
   */
  generateChordProgression(options = {}) {
    const {
      type = 'pop',
      rootNote = 48, // C3
      bars = 4,
      beatsPerBar = 4
    } = options;

    const progression = this.chordProgressions[type];
    const chords = [];

    for (let bar = 0; bar < bars; bar++) {
      const chordTemplate = progression[bar % progression.length];
      const chord = chordTemplate.map(interval =>
        this.midiToNoteName(rootNote + interval)
      );

      chords.push({
        notes: chord,
        time: bar * beatsPerBar,
        duration: beatsPerBar + 'n',
        velocity: 0.5
      });
    }

    return chords;
  }

  /**
   * 生成节奏模式
   */
  generateRhythm(options = {}) {
    const {
      pattern = 'straight',
      length = 16,
      instruments = ['kick', 'snare', 'hihat']
    } = options;

    const rhythmPattern = this.rhythmPatterns[pattern];
    const rhythm = {};

    instruments.forEach(instrument => {
      rhythm[instrument] = [];

      for (let i = 0; i < length; i++) {
        const patternIndex = i % rhythmPattern.length;

        if (rhythmPattern[patternIndex] === 1) {
          let velocity = 0.7;

          // 不同乐器的不同处理
          if (instrument === 'hihat') {
            velocity = 0.3 + Math.random() * 0.2;
          } else if (instrument === 'kick') {
            velocity = 0.8 + Math.random() * 0.2;
          }

          rhythm[instrument].push({
            time: i * 0.25,
            velocity: velocity
          });
        }
      }
    });

    return rhythm;
  }

  /**
   * 生成完整音乐片段
   */
  generateFullComposition(options = {}) {
    const {
      scale = 'major',
      rootNote = 60,
      bpm = 120,
      bars = 8,
      includeChords = true,
      includeRhythm = true,
      style = 'pop'
    } = options;

    const composition = {
      melody: [],
      chords: [],
      rhythm: {},
      bpm: bpm,
      scale: scale,
      rootNote: rootNote
    };

    // 生成旋律
    composition.melody = this.generateMarkovMelody({
      scale,
      rootNote,
      length: bars * 8
    });

    // 生成和弦
    if (includeChords) {
      composition.chords = this.generateChordProgression({
        type: style,
        rootNote: rootNote - 12,
        bars: bars
      });
    }

    // 生成节奏
    if (includeRhythm) {
      composition.rhythm = this.generateRhythm({
        pattern: this.getRhythmPatternForStyle(style),
        length: bars * 16
      });
    }

    return composition;
  }

  /**
   * 选择下一个音符（马可夫链）
   */
  selectNextNote(currentIndex, scaleLength) {
    const transitions = this.markovChains.simple[currentIndex % 7];
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < transitions.length; i++) {
      cumulative += transitions[i];
      if (random <= cumulative) {
        return i % scaleLength;
      }
    }

    return 0;
  }

  /**
   * 获取随机时值
   */
  getRandomDuration() {
    const durations = ['8n', '8n', '8n', '4n', '4n', '16n'];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  /**
   * 根据风格选择节奏模式
   */
  getRhythmPatternForStyle(style) {
    const stylePatterns = {
      pop: 'straight',
      jazz: 'swing',
      blues: 'swing',
      sad: 'straight',
      ambient: 'complex'
    };
    return stylePatterns[style] || 'straight';
  }

  /**
   * MIDI 音符转音符名称
   */
  midiToNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return noteName + octave;
  }

  /**
   * 音符名称转 MIDI
   */
  noteNameToMidi(noteName) {
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    const match = noteName.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60;

    const note = match[1];
    const octave = parseInt(match[2]);

    return (octave + 1) * 12 + noteMap[note];
  }

  /**
   * 和谐度检查（简单实现）
   */
  isHarmonic(note1, note2) {
    const interval = Math.abs(note1 - note2) % 12;
    const harmonicIntervals = [0, 3, 4, 5, 7, 8, 9, 12];
    return harmonicIntervals.includes(interval);
  }

  /**
   * 生成琶音
   */
  generateArpeggio(chord, pattern = 'up', length = 8) {
    const arpeggio = [];
    const patterns = {
      up: (i, len) => i % len,
      down: (i, len) => len - 1 - (i % len),
      updown: (i, len) => {
        const cycle = (len - 1) * 2;
        const pos = i % cycle;
        return pos < len ? pos : cycle - pos;
      },
      random: (i, len) => Math.floor(Math.random() * len)
    };

    const patternFunc = patterns[pattern] || patterns.up;

    for (let i = 0; i < length; i++) {
      const noteIndex = patternFunc(i, chord.length);
      arpeggio.push({
        note: chord[noteIndex],
        duration: '8n',
        time: i * 0.5,
        velocity: 0.6
      });
    }

    return arpeggio;
  }

  /**
   * 应用摇摆节奏
   */
  applySwing(notes, swingAmount = 0.66) {
    return notes.map((note, i) => {
      if (i % 2 === 1) {
        return {
          ...note,
          time: note.time + (swingAmount - 0.5) * 0.25
        };
      }
      return note;
    });
  }

  /**
   * 量化音符（对齐到网格）
   */
  quantize(notes, gridSize = 0.25) {
    return notes.map(note => ({
      ...note,
      time: Math.round(note.time / gridSize) * gridSize
    }));
  }

  /**
   * 添加人性化（微小的时间和力度变化）
   */
  humanize(notes, timeVariation = 0.02, velocityVariation = 0.1) {
    return notes.map(note => ({
      ...note,
      time: note.time + (Math.random() - 0.5) * timeVariation,
      velocity: Math.max(0.1, Math.min(1,
        note.velocity + (Math.random() - 0.5) * velocityVariation
      ))
    }));
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicEngine;
}
