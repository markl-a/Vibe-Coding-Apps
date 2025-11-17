// Hashtag Generator
class HashtagGenerator {
  constructor() {
    this.platform = 'instagram';
    this.count = 10;
    this.includeTrending = true;
    this.selectedHashtags = new Set();
    this.init();
  }

  init() {
    this.setupEventListeners();
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

  generateHashtags() {
    const topic = document.getElementById('topicInput').value.trim();

    if (!topic) {
      this.showToast('請輸入主題或關鍵字', 'error');
      return;
    }

    const hashtags = this.getHashtagsForTopic(topic);
    this.displayHashtags(hashtags);
    this.showResults();
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
