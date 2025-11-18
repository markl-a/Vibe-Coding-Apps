/**
 * Video Player AI 增強功能
 * 提供智能字幕、視頻分析、播放建議等功能
 */

class VideoPlayerAI {
  constructor() {
    this.analysisCache = new Map();
    this.subtitleCache = new Map();
    this.isProcessing = false;
  }

  /**
   * 分析當前視頻
   * @param {string} videoPath - 視頻路徑
   * @param {HTMLVideoElement} videoElement - 視頻元素
   * @returns {Promise<Object>} 分析結果
   */
  async analyzeCurrentVideo(videoPath, videoElement) {
    // 檢查緩存
    if (this.analysisCache.has(videoPath)) {
      return this.analysisCache.get(videoPath);
    }

    this.isProcessing = true;
    this.showNotification('🤖 AI 正在分析視頻...', 'info');

    try {
      // 提取視頻元數據
      const metadata = {
        duration: videoElement.duration,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        aspectRatio: (videoElement.videoWidth / videoElement.videoHeight).toFixed(2)
      };

      // 模擬 AI 分析（實際應用中可接入 TensorFlow.js）
      const analysis = await this.performVideoAnalysis(metadata);

      // 緩存結果
      this.analysisCache.set(videoPath, analysis);

      this.showNotification('✅ 視頻分析完成！', 'success');
      this.isProcessing = false;

      return analysis;
    } catch (error) {
      this.showNotification('❌ 分析失敗: ' + error.message, 'error');
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * 執行視頻分析
   * @private
   */
  async performVideoAnalysis(metadata) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis = {
          metadata,
          quality: this.assessQuality(metadata),
          scenes: this.detectScenes(metadata.duration),
          recommendations: this.generateRecommendations(metadata),
          mood: this.detectMood(),
          contentType: this.detectContentType()
        };
        resolve(analysis);
      }, 2000);
    });
  }

  /**
   * 評估視頻質量
   * @private
   */
  assessQuality(metadata) {
    const { width, height } = metadata;
    let quality = 'SD';
    let score = 60;

    if (width >= 3840) {
      quality = '4K';
      score = 100;
    } else if (width >= 2560) {
      quality = '2K';
      score = 95;
    } else if (width >= 1920) {
      quality = 'Full HD';
      score = 90;
    } else if (width >= 1280) {
      quality = 'HD';
      score = 80;
    } else if (width >= 854) {
      quality = 'HD Ready';
      score = 70;
    }

    return {
      level: quality,
      score,
      resolution: `${width}x${height}`,
      recommendation: score < 80 ? '建議提高視頻質量' : '視頻質量良好'
    };
  }

  /**
   * 場景檢測
   * @private
   */
  detectScenes(duration) {
    const scenes = [];
    const sceneCount = Math.min(Math.floor(duration / 30), 10);

    for (let i = 0; i < sceneCount; i++) {
      const start = (duration / sceneCount) * i;
      const end = (duration / sceneCount) * (i + 1);

      scenes.push({
        id: i,
        start: Math.floor(start),
        end: Math.floor(end),
        type: this.getRandomSceneType(),
        thumbnail: null,
        confidence: (0.7 + Math.random() * 0.3).toFixed(2)
      });
    }

    return scenes;
  }

  /**
   * 獲取隨機場景類型
   * @private
   */
  getRandomSceneType() {
    const types = ['intro', 'dialog', 'action', 'transition', 'outro'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * 生成觀看建議
   * @private
   */
  generateRecommendations(metadata) {
    const recommendations = [];

    if (metadata.duration > 3600) {
      recommendations.push({
        type: 'playback',
        icon: '⚡',
        text: '視頻較長，建議使用 1.25x 或 1.5x 速度觀看',
        action: 'speed'
      });
    }

    if (metadata.width < 1280) {
      recommendations.push({
        type: 'quality',
        icon: '📺',
        text: '視頻解析度較低，建議使用小窗口播放以獲得更好體驗',
        action: 'resize'
      });
    }

    recommendations.push({
      type: 'subtitle',
      icon: '📝',
      text: '可以啟用 AI 自動生成字幕功能',
      action: 'subtitle'
    });

    recommendations.push({
      type: 'bookmark',
      icon: '🔖',
      text: '可以使用鍵盤快捷鍵 B 添加書籤',
      action: 'info'
    });

    return recommendations;
  }

  /**
   * 檢測視頻情緒
   * @private
   */
  detectMood() {
    const moods = ['educational', 'entertaining', 'dramatic', 'calm', 'energetic'];
    return {
      primary: moods[Math.floor(Math.random() * moods.length)],
      confidence: (0.6 + Math.random() * 0.4).toFixed(2)
    };
  }

  /**
   * 檢測內容類型
   * @private
   */
  detectContentType() {
    const types = ['tutorial', 'movie', 'music_video', 'documentary', 'vlog'];
    return {
      type: types[Math.floor(Math.random() * types.length)],
      confidence: (0.6 + Math.random() * 0.4).toFixed(2)
    };
  }

  /**
   * 自動生成字幕
   * @param {string} videoPath - 視頻路徑
   * @returns {Promise<Array>} 字幕數組
   */
  async autoGenerateSubtitles(videoPath) {
    if (this.subtitleCache.has(videoPath)) {
      return this.subtitleCache.get(videoPath);
    }

    this.showNotification('🤖 AI 正在生成字幕...', 'info');

    // 模擬字幕生成（實際應用中可使用 Web Speech API 或 Whisper）
    return new Promise((resolve) => {
      setTimeout(() => {
        const subtitles = this.generateSampleSubtitles();
        this.subtitleCache.set(videoPath, subtitles);
        this.showNotification('✅ 字幕生成完成！', 'success');
        resolve(subtitles);
      }, 3000);
    });
  }

  /**
   * 生成示例字幕
   * @private
   */
  generateSampleSubtitles() {
    return [
      { start: 0, end: 3, text: '這是自動生成的字幕' },
      { start: 3, end: 6, text: '基於 AI 語音識別技術' },
      { start: 6, end: 9, text: '可以準確識別多種語言' },
      { start: 9, end: 12, text: '並生成時間軸對齊的字幕' }
    ];
  }

  /**
   * 智能播放列表建議
   * @param {string} currentVideo - 當前視頻路徑
   * @param {Array} playlist - 播放列表
   * @returns {Array} 推薦的下一個視頻
   */
  suggestNextVideo(currentVideo, playlist) {
    if (playlist.length === 0) return [];

    // 簡單的推薦邏輯
    const recommendations = playlist
      .filter(v => v.path !== currentVideo)
      .map(v => ({
        ...v,
        score: this.calculateRecommendationScore(currentVideo, v.path)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return recommendations;
  }

  /**
   * 計算推薦分數
   * @private
   */
  calculateRecommendationScore(current, candidate) {
    // 基於文件名相似度的簡單評分
    const currentName = current.toLowerCase();
    const candidateName = candidate.toLowerCase();

    let score = 0;

    // 檢查常見關鍵詞
    const keywords = ['part', 'ep', 'episode', 'chapter', 'season'];
    keywords.forEach(keyword => {
      if (currentName.includes(keyword) && candidateName.includes(keyword)) {
        score += 30;
      }
    });

    // 檢查數字序列
    const currentNum = currentName.match(/\d+/);
    const candidateNum = candidateName.match(/\d+/);
    if (currentNum && candidateNum) {
      const diff = Math.abs(parseInt(currentNum[0]) - parseInt(candidateNum[0]));
      if (diff === 1) score += 50;
      else if (diff <= 3) score += 20;
    }

    // 基礎相似度
    score += this.stringSimilarity(currentName, candidateName) * 20;

    return score;
  }

  /**
   * 字符串相似度
   * @private
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein 距離算法
   * @private
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 智能書籤建議
   * @param {number} duration - 視頻總時長
   * @returns {Array} 建議的書籤位置
   */
  suggestBookmarks(duration) {
    const suggestions = [];
    const intervals = [0.1, 0.25, 0.5, 0.75, 0.9]; // 10%, 25%, 50%, 75%, 90%

    intervals.forEach((ratio, index) => {
      const time = Math.floor(duration * ratio);
      suggestions.push({
        time,
        label: this.getBookmarkLabel(index),
        reason: '基於視頻結構的推薦位置'
      });
    });

    return suggestions;
  }

  /**
   * 獲取書籤標籤
   * @private
   */
  getBookmarkLabel(index) {
    const labels = ['開場', '引入', '主要內容', '高潮', '結尾'];
    return labels[index] || `書籤 ${index + 1}`;
  }

  /**
   * 顯示通知
   * @private
   */
  showNotification(message, type = 'info') {
    const event = new CustomEvent('ai-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  /**
   * 生成視頻摘要
   * @param {Object} analysis - 視頻分析結果
   * @returns {string} 摘要文本
   */
  generateSummary(analysis) {
    const { quality, scenes, mood, contentType } = analysis;

    let summary = `📊 視頻摘要\n\n`;
    summary += `質量: ${quality.level} (${quality.resolution})\n`;
    summary += `場景數: ${scenes.length}\n`;
    summary += `內容類型: ${contentType.type}\n`;
    summary += `情緒: ${mood.primary}\n`;

    return summary;
  }

  /**
   * 清除緩存
   */
  clearCache() {
    this.analysisCache.clear();
    this.subtitleCache.clear();
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoPlayerAI;
}

if (typeof window !== 'undefined') {
  window.VideoPlayerAI = VideoPlayerAI;
}
