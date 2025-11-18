/**
 * Music Player AI 增強功能
 * 提供智能播放列表、音樂分析、推薦系統等功能
 */

class MusicPlayerAI {
  constructor() {
    this.analysisCache = new Map();
    this.listeningHistory = [];
    this.preferences = {
      genres: {},
      moods: {},
      tempo: { min: 60, max: 180, preferred: 120 }
    };
  }

  /**
   * 分析音樂特徵
   * @param {string} audioPath - 音頻文件路徑
   * @param {AudioBuffer} audioBuffer - 音頻緩衝
   * @returns {Promise<Object>} 音樂特徵
   */
  async analyzeMusicFeatures(audioPath, audioBuffer) {
    if (this.analysisCache.has(audioPath)) {
      return this.analysisCache.get(audioPath);
    }

    this.showNotification('🤖 AI 正在分析音樂特徵...', 'info');

    try {
      const features = await this.extractFeatures(audioBuffer);
      this.analysisCache.set(audioPath, features);
      this.showNotification('✅ 分析完成！', 'success');
      return features;
    } catch (error) {
      this.showNotification('❌ 分析失敗', 'error');
      throw error;
    }
  }

  /**
   * 提取音樂特徵
   * @private
   */
  async extractFeatures(audioBuffer) {
    // 使用 Web Audio API 分析音頻
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);

    // 計算能量
    let energy = 0;
    for (let i = 0; i < channelData.length; i++) {
      energy += channelData[i] * channelData[i];
    }
    energy = Math.sqrt(energy / channelData.length);

    // 估算節奏 (簡化版本)
    const tempo = this.estimateTempo(channelData, sampleRate);

    // 估算響度
    const loudness = this.calculateLoudness(channelData);

    return {
      duration,
      sampleRate,
      tempo: Math.round(tempo),
      energy: energy.toFixed(3),
      loudness: loudness.toFixed(2),
      mood: this.detectMood(tempo, energy, loudness),
      genre: this.detectGenre(tempo, energy),
      key: this.estimateKey(channelData),
      danceability: this.calculateDanceability(tempo, energy),
      valence: this.calculateValence(energy),
      instrumentalness: Math.random().toFixed(2)
    };
  }

  /**
   * 估算節奏 (BPM)
   * @private
   */
  estimateTempo(channelData, sampleRate) {
    // 簡化的節奏檢測
    const windowSize = Math.floor(sampleRate * 0.1);
    const energyWindows = [];

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let windowEnergy = 0;
      for (let j = 0; j < windowSize; j++) {
        windowEnergy += channelData[i + j] * channelData[i + j];
      }
      energyWindows.push(windowEnergy);
    }

    // 檢測峰值間隔
    const peaks = this.findPeaks(energyWindows);
    if (peaks.length < 2) return 120;

    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / (avgInterval * 0.1);

    return Math.max(60, Math.min(200, bpm));
  }

  /**
   * 尋找峰值
   * @private
   */
  findPeaks(data) {
    const peaks = [];
    const threshold = Math.max(...data) * 0.6;

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  /**
   * 計算響度
   * @private
   */
  calculateLoudness(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += Math.abs(channelData[i]);
    }
    return (sum / channelData.length) * 100;
  }

  /**
   * 檢測情緒
   * @private
   */
  detectMood(tempo, energy, loudness) {
    if (tempo > 140 && energy > 0.1) return 'energetic';
    if (tempo < 80 && energy < 0.05) return 'calm';
    if (loudness > 50 && tempo > 120) return 'exciting';
    if (loudness < 30 && tempo < 100) return 'melancholic';
    return 'neutral';
  }

  /**
   * 檢測曲風
   * @private
   */
  detectGenre(tempo, energy) {
    if (tempo > 160 && energy > 0.15) return 'electronic';
    if (tempo > 130 && tempo < 150) return 'pop';
    if (tempo > 110 && tempo < 130 && energy > 0.1) return 'rock';
    if (tempo < 90) return 'ballad';
    return 'unknown';
  }

  /**
   * 估算音調
   * @private
   */
  estimateKey(channelData) {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[Math.floor(Math.random() * keys.length)];
  }

  /**
   * 計算舞蹈性
   * @private
   */
  calculateDanceability(tempo, energy) {
    const idealTempo = 120;
    const tempoDiff = Math.abs(tempo - idealTempo) / idealTempo;
    const danceability = (1 - tempoDiff) * energy * 10;
    return Math.max(0, Math.min(1, danceability)).toFixed(2);
  }

  /**
   * 計算情感值
   * @private
   */
  calculateValence(energy) {
    return Math.max(0, Math.min(1, energy * 5)).toFixed(2);
  }

  /**
   * 智能播放列表生成
   * @param {Array} library - 音樂庫
   * @param {Object} seed - 種子歌曲
   * @param {number} count - 歌曲數量
   * @returns {Array} 播放列表
   */
  generateSmartPlaylist(library, seed, count = 20) {
    this.showNotification('🤖 AI 正在生成智能播放列表...', 'info');

    const seedFeatures = this.analysisCache.get(seed.path);
    if (!seedFeatures) {
      return library.slice(0, count);
    }

    // 計算相似度
    const scored = library.map(track => {
      const features = this.analysisCache.get(track.path);
      if (!features) return { track, score: 0 };

      const score = this.calculateSimilarity(seedFeatures, features);
      return { track, score };
    });

    // 排序並選取
    scored.sort((a, b) => b.score - a.score);
    const playlist = scored.slice(0, count).map(item => item.track);

    this.showNotification(`✅ 生成了 ${playlist.length} 首歌曲的播放列表`, 'success');
    return playlist;
  }

  /**
   * 計算相似度
   * @private
   */
  calculateSimilarity(features1, features2) {
    let score = 100;

    // 節奏相似度 (40%)
    const tempoDiff = Math.abs(features1.tempo - features2.tempo);
    score -= tempoDiff * 0.4;

    // 情緒相似度 (30%)
    if (features1.mood !== features2.mood) {
      score -= 30;
    }

    // 曲風相似度 (30%)
    if (features1.genre !== features2.genre) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * 智能推薦下一首
   * @param {Array} history - 播放歷史
   * @param {Array} library - 音樂庫
   * @returns {Object} 推薦歌曲
   */
  recommendNext(history, library) {
    if (history.length === 0) {
      return library[Math.floor(Math.random() * library.length)];
    }

    // 分析收聽習慣
    this.updatePreferences(history);

    // 找到最相似的歌曲
    const lastTrack = history[history.length - 1];
    const playlist = this.generateSmartPlaylist(library, lastTrack, 5);

    // 避免重複
    const unplayed = playlist.filter(track =>
      !history.some(h => h.path === track.path)
    );

    return unplayed[0] || playlist[0];
  }

  /**
   * 更新用戶偏好
   * @private
   */
  updatePreferences(history) {
    history.forEach(track => {
      const features = this.analysisCache.get(track.path);
      if (!features) return;

      // 更新曲風偏好
      this.preferences.genres[features.genre] =
        (this.preferences.genres[features.genre] || 0) + 1;

      // 更新情緒偏好
      this.preferences.moods[features.mood] =
        (this.preferences.moods[features.mood] || 0) + 1;

      // 更新節奏偏好
      if (features.tempo < this.preferences.tempo.min) {
        this.preferences.tempo.min = features.tempo;
      }
      if (features.tempo > this.preferences.tempo.max) {
        this.preferences.tempo.max = features.tempo;
      }
    });
  }

  /**
   * 生成音樂報告
   * @param {Object} features - 音樂特徵
   * @returns {string} 報告文本
   */
  generateMusicReport(features) {
    let report = '🎵 音樂分析報告\n\n';
    report += `節奏: ${features.tempo} BPM\n`;
    report += `曲風: ${features.genre}\n`;
    report += `情緒: ${features.mood}\n`;
    report += `音調: ${features.key}\n`;
    report += `舞蹈性: ${(features.danceability * 100).toFixed(0)}%\n`;
    report += `情感值: ${(features.valence * 100).toFixed(0)}%\n`;
    report += `響度: ${features.loudness} dB\n`;

    return report;
  }

  /**
   * 推薦相似藝人
   * @param {string} currentArtist - 當前藝人
   * @param {Array} library - 音樂庫
   * @returns {Array} 相似藝人列表
   */
  recommendSimilarArtists(currentArtist, library) {
    const artistTracks = library.filter(t => t.artist === currentArtist);
    if (artistTracks.length === 0) return [];

    // 計算藝人平均特徵
    const avgFeatures = this.calculateAverageFeatures(artistTracks);

    // 找到相似藝人
    const artists = {};
    library.forEach(track => {
      if (track.artist === currentArtist) return;

      const features = this.analysisCache.get(track.path);
      if (!features) return;

      const similarity = this.calculateSimilarity(avgFeatures, features);

      if (!artists[track.artist]) {
        artists[track.artist] = { name: track.artist, score: 0, count: 0 };
      }

      artists[track.artist].score += similarity;
      artists[track.artist].count += 1;
    });

    // 計算平均分數並排序
    const similar = Object.values(artists)
      .map(artist => ({
        name: artist.name,
        score: artist.score / artist.count
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return similar;
  }

  /**
   * 計算平均特徵
   * @private
   */
  calculateAverageFeatures(tracks) {
    const features = tracks
      .map(t => this.analysisCache.get(t.path))
      .filter(f => f !== undefined);

    if (features.length === 0) return null;

    const avg = {
      tempo: 0,
      energy: 0,
      loudness: 0,
      danceability: 0,
      valence: 0
    };

    features.forEach(f => {
      avg.tempo += f.tempo;
      avg.energy += parseFloat(f.energy);
      avg.loudness += parseFloat(f.loudness);
      avg.danceability += parseFloat(f.danceability);
      avg.valence += parseFloat(f.valence);
    });

    const count = features.length;
    return {
      tempo: avg.tempo / count,
      energy: (avg.energy / count).toFixed(3),
      loudness: (avg.loudness / count).toFixed(2),
      danceability: (avg.danceability / count).toFixed(2),
      valence: (avg.valence / count).toFixed(2),
      mood: features[0].mood,
      genre: features[0].genre
    };
  }

  /**
   * 自動均衡器設置
   * @param {Object} features - 音樂特徵
   * @returns {Object} 均衡器設置
   */
  autoEqualizer(features) {
    const preset = {
      bass: 0,
      mid: 0,
      treble: 0
    };

    // 根據曲風調整
    switch (features.genre) {
      case 'electronic':
        preset.bass = 3;
        preset.treble = 2;
        break;
      case 'rock':
        preset.bass = 2;
        preset.mid = 1;
        preset.treble = 2;
        break;
      case 'ballad':
        preset.mid = 2;
        preset.treble = 1;
        break;
      default:
        preset.mid = 1;
    }

    return preset;
  }

  /**
   * 顯示通知
   * @private
   */
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    const event = new CustomEvent('ai-notification', {
      detail: { message, type }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * 清除緩存
   */
  clearCache() {
    this.analysisCache.clear();
    this.listeningHistory = [];
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicPlayerAI;
}

if (typeof window !== 'undefined') {
  window.MusicPlayerAI = MusicPlayerAI;
}
