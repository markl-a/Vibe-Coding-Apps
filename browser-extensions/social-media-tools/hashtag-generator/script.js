// Hashtag Generator with AI Enhancement
class HashtagGenerator {
  constructor() {
    this.platform = 'instagram';
    this.count = 10;
    this.includeTrending = true;
    this.selectedHashtags = new Set();
    this.useAI = false; // AI feature toggle
    this.generationHistory = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['useAI', 'generationHistory']);
      this.useAI = result.useAI || false;
      this.generationHistory = result.generationHistory || [];
    } catch (error) {
      console.log('Running in non-extension mode');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        useAI: this.useAI,
        generationHistory: this.generationHistory.slice(-50) // Keep last 50
      });
    } catch (error) {
      console.log('Running in non-extension mode');
    }
  }

  setupEventListeners() {
    // Platform buttons
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.platform = e.target.dataset.platform;
      });
    });

    // Hashtag count slider
    document.getElementById('hashtagCount').addEventListener('input', (e) => {
      this.count = parseInt(e.target.value);
      document.getElementById('countValue').textContent = this.count;
    });

    // Include trending checkbox
    document.getElementById('includeTrending').addEventListener('change', (e) => {
      this.includeTrending = e.target.checked;
    });

    // AI toggle
    document.getElementById('useAI').addEventListener('change', async (e) => {
      this.useAI = e.target.checked;
      await this.saveSettings();
      this.showToast(this.useAI ? '✓ AI 增強已啟用' : 'AI 增強已關閉');
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', () => {
      this.generateHashtags();
    });

    // Copy all button
    document.getElementById('copyAllBtn').addEventListener('click', () => {
      this.copyAll();
    });

    // Copy selected button
    document.getElementById('copySelectedBtn').addEventListener('click', () => {
      this.copySelected();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.generateHashtags();
    });
  }

  async generateHashtags() {
    const topic = document.getElementById('topicInput').value.trim();

    if (!topic) {
      this.showToast('請輸入主題或關鍵字', 'error');
      return;
    }

    // Show loading state
    const btn = document.getElementById('generateBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ 生成中...';
    btn.disabled = true;

    try {
      let hashtags;

      if (this.useAI) {
        // Try AI-enhanced generation
        hashtags = await this.getAIHashtags(topic);
        if (!hashtags || hashtags.length === 0) {
          // Fallback to rule-based
          hashtags = this.getHashtagsForTopic(topic);
        }
      } else {
        // Use rule-based generation
        hashtags = this.getHashtagsForTopic(topic);
      }

      this.displayHashtags(hashtags);
      this.showResults();

      // Save to history
      this.generationHistory.push({
        topic,
        platform: this.platform,
        count: hashtags.length,
        timestamp: Date.now()
      });
      await this.saveSettings();

    } catch (error) {
      console.error('Generation error:', error);
      this.showToast('生成失敗，請重試', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  /**
   * AI-Enhanced hashtag generation
   * Uses intelligent algorithms to suggest relevant hashtags
   */
  async getAIHashtags(topic) {
    try {
      // Simulate AI processing with intelligent rule-based system
      await new Promise(resolve => setTimeout(resolve, 500));

      const keywords = this.extractKeywords(topic);
      const hashtags = new Set();

      // 1. Core topic hashtags
      keywords.forEach(keyword => {
        hashtags.add(`#${keyword}`);
      });

      // 2. Related concepts using word associations
      const related = this.getRelatedConcepts(keywords, this.platform);
      related.forEach(tag => hashtags.add(tag));

      // 3. Platform-specific trending
      const platformTrending = this.getPlatformHashtags(this.platform);
      platformTrending.slice(0, 3).forEach(tag => hashtags.add(tag));

      // 4. Engagement-boosting tags
      const engagementTags = this.getEngagementTags(this.platform);
      engagementTags.forEach(tag => hashtags.add(tag));

      // 5. Niche-specific tags
      const nicheTags = this.getNicheTags(keywords);
      nicheTags.forEach(tag => hashtags.add(tag));

      // Convert to array and limit
      let result = Array.from(hashtags).slice(0, this.count);

      // Mark trending and add metadata
      result = result.map(tag => ({
        text: tag,
        trending: this.isTrending(tag),
        relevance: this.calculateRelevance(tag, keywords)
      }));

      // Sort by relevance
      result.sort((a, b) => b.relevance - a.relevance);

      return result;
    } catch (error) {
      console.error('AI generation error:', error);
      return null;
    }
  }

  extractKeywords(text) {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = text.toLowerCase()
      .split(/[\s,，、]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    return [...new Set(words)];
  }

  getRelatedConcepts(keywords, platform) {
    const conceptMap = {
      travel: ['wanderlust', 'adventure', 'explore', 'travelphotography', 'vacation'],
      food: ['foodie', 'yummy', 'delicious', 'foodporn', 'instafood', 'cooking'],
      fitness: ['workout', 'gym', 'health', 'fitfam', 'motivation', 'training'],
      photo: ['photography', 'photographer', 'photooftheday', 'picoftheday', 'camera'],
      fashion: ['style', 'ootd', 'fashionista', 'outfit', 'trendy', 'fashionblogger'],
      tech: ['technology', 'innovation', 'gadgets', 'coding', 'developer', 'startup'],
      art: ['artist', 'artwork', 'creative', 'design', 'illustration', 'artistic'],
      music: ['musician', 'song', 'concert', 'band', 'musical', 'soundtrack'],
      nature: ['naturephotography', 'landscape', 'outdoors', 'wildlife', 'scenic'],
      beauty: ['makeup', 'skincare', 'beautyblogger', 'cosmetics', 'beautytips']
    };

    const related = new Set();
    keywords.forEach(keyword => {
      // Direct match
      if (conceptMap[keyword]) {
        conceptMap[keyword].forEach(concept => related.add(`#${concept}`));
      }

      // Partial match
      Object.keys(conceptMap).forEach(key => {
        if (keyword.includes(key) || key.includes(keyword)) {
          conceptMap[key].slice(0, 2).forEach(concept => related.add(`#${concept}`));
        }
      });
    });

    return Array.from(related);
  }

  getEngagementTags(platform) {
    const engagementMap = {
      instagram: ['#instagood', '#instadaily', '#instalike', '#follow'],
      twitter: ['#trending', '#viral', '#followback'],
      tiktok: ['#fyp', '#foryou', '#viral'],
      youtube: ['#subscribe', '#youtuber', '#trending']
    };

    return engagementMap[platform] || [];
  }

  getNicheTags(keywords) {
    const nicheTags = [];
    keywords.forEach(keyword => {
      nicheTags.push(`#${keyword}community`);
      nicheTags.push(`#${keyword}lovers`);
      nicheTags.push(`#daily${keyword}`);
    });
    return nicheTags.slice(0, 3);
  }

  calculateRelevance(tag, keywords) {
    let relevance = 0;
    const tagLower = tag.toLowerCase();

    keywords.forEach(keyword => {
      if (tagLower.includes(keyword)) {
        relevance += 10;
      }
    });

    // Boost for trending tags
    if (this.isTrending(tag)) {
      relevance += 5;
    }

    return relevance + Math.random() * 3; // Add slight randomness
  }

  getHashtagsForTopic(topic) {
    const keywords = topic.toLowerCase().split(/[\s,]+/);
    const hashtags = new Set();

    // Platform-specific hashtags
    const platformTags = this.getPlatformHashtags(this.platform);

    // General hashtags based on keywords
    keywords.forEach(keyword => {
      const variations = this.generateVariations(keyword);
      variations.forEach(tag => hashtags.add(tag));
    });

    // Add platform tags
    platformTags.forEach(tag => hashtags.add(tag));

    // Add trending tags if enabled
    if (this.includeTrending) {
      const trending = this.getTrendingHashtags(this.platform);
      trending.forEach(tag => hashtags.add(tag));
    }

    // Convert to array and limit
    let result = Array.from(hashtags).slice(0, this.count);

    // Mark trending
    result = result.map(tag => ({
      text: tag,
      trending: this.isTrending(tag)
    }));

    return result;
  }

  generateVariations(keyword) {
    const variations = [
      `#${keyword}`,
      `#${keyword}gram`,
      `#${keyword}love`,
      `#${keyword}life`,
      `#${keyword}daily`,
      `#insta${keyword}`,
      `#${keyword}photo`,
      `#${keyword}lovers`,
      `#${keyword}addict`,
      `#${keyword}style`
    ];

    return variations.slice(0, 3); // Limit variations
  }

  getPlatformHashtags(platform) {
    const platformTags = {
      instagram: [
        '#instagood', '#photooftheday', '#picoftheday', '#instadaily',
        '#instalike', '#instamood', '#followme', '#like4like'
      ],
      twitter: [
        '#trending', '#viral', '#news', '#breaking'
      ],
      tiktok: [
        '#fyp', '#foryou', '#foryoupage', '#viral', '#trending'
      ],
      youtube: [
        '#youtube', '#youtuber', '#subscribe', '#video', '#vlog'
      ]
    };

    return platformTags[platform] || [];
  }

  getTrendingHashtags(platform) {
    const trending = {
      instagram: [
        '#love', '#fashion', '#photography', '#art', '#travel',
        '#food', '#fitness', '#beauty', '#nature', '#lifestyle'
      ],
      twitter: [
        '#news', '#politics', '#sports', '#tech', '#entertainment'
      ],
      tiktok: [
        '#dance', '#comedy', '#music', '#challenge', '#duet'
      ],
      youtube: [
        '#gaming', '#tutorial', '#review', '#vlog', '#entertainment'
      ]
    };

    return trending[platform] || [];
  }

  isTrending(tag) {
    const allTrending = [
      ...this.getTrendingHashtags('instagram'),
      ...this.getTrendingHashtags('twitter'),
      ...this.getTrendingHashtags('tiktok'),
      ...this.getTrendingHashtags('youtube')
    ];

    return allTrending.includes(tag);
  }

  displayHashtags(hashtags) {
    const container = document.getElementById('hashtagContainer');
    this.selectedHashtags.clear();

    container.innerHTML = hashtags.map(({ text, trending }) => `
      <div class="hashtag-tag ${trending ? 'trending' : ''}" data-tag="${text}">
        ${text}
      </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.hashtag-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        this.toggleSelection(tag);
      });

      // Auto-select all initially
      this.selectedHashtags.add(tag.dataset.tag);
      tag.classList.add('selected');
    });

    this.updateStats(hashtags.length);
  }

  toggleSelection(tagElement) {
    const tag = tagElement.dataset.tag;

    if (this.selectedHashtags.has(tag)) {
      this.selectedHashtags.delete(tag);
      tagElement.classList.remove('selected');
    } else {
      this.selectedHashtags.add(tag);
      tagElement.classList.add('selected');
    }

    this.updateStats(document.querySelectorAll('.hashtag-tag').length);
  }

  updateStats(total) {
    document.getElementById('totalCount').textContent = total;
    document.getElementById('selectedCount').textContent = this.selectedHashtags.size;

    const selectedText = Array.from(this.selectedHashtags).join(' ');
    document.getElementById('charCount').textContent = selectedText.length;
  }

  showResults() {
    document.getElementById('resultsSection').style.display = 'block';
  }

  async copyAll() {
    const allTags = Array.from(document.querySelectorAll('.hashtag-tag'))
      .map(tag => tag.dataset.tag)
      .join(' ');

    await this.copyToClipboard(allTags);
  }

  async copySelected() {
    if (this.selectedHashtags.size === 0) {
      this.showToast('請先選擇要複製的標籤', 'error');
      return;
    }

    const selectedText = Array.from(this.selectedHashtags).join(' ');
    await this.copyToClipboard(selectedText);
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`✓ 已複製 ${this.selectedHashtags.size} 個標籤`);
    } catch (error) {
      this.showToast('複製失敗', 'error');
    }
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

// Initialize
const generator = new HashtagGenerator();
