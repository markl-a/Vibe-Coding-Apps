// Clipboard Manager Popup Script
class ClipboardManagerPopup {
  constructor() {
    this.history = [];
    this.filteredHistory = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    await this.loadHistory();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadHistory() {
    const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
    this.history = response.history || [];
    this.applyFilters();
  }

  setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.applyFilters();
      });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearHistory();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.history];

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(item =>
        item.text.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply type filter
    switch (this.currentFilter) {
      case 'pinned':
        filtered = filtered.filter(item => item.pinned);
        break;
      case 'recent':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(item => item.timestamp >= today.getTime());
        break;
    }

    this.filteredHistory = filtered;
    this.displayHistory();
    this.updateStats();
  }

  displayHistory() {
    const container = document.getElementById('clipboardList');

    if (this.filteredHistory.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>${this.searchQuery ? '找不到結果' : '剪貼簿是空的'}</h3>
          <p>${this.searchQuery ? '試試其他搜尋詞' : '複製一些文字開始使用'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredHistory.map((item, index) => `
      <div class="clipboard-item ${item.pinned ? 'pinned' : ''}" data-index="${index}">
        <div class="item-header">
          <span class="item-type">${item.type || 'text'}</span>
          <div class="item-actions">
            <button class="action-btn ${item.pinned ? 'pinned' : ''}" data-action="pin" title="釘選">
              📌
            </button>
            <button class="action-btn" data-action="copy" title="複製">
              📄
            </button>
            <button class="action-btn" data-action="delete" title="刪除">
              🗑️
            </button>
          </div>
        </div>
        <div class="item-text" title="${this.escapeHtml(item.text)}">
          ${this.highlightSearch(this.escapeHtml(this.truncateText(item.text, 200)))}
        </div>
        <div class="item-meta">
          <span class="item-time">
            🕒 ${this.formatTime(item.timestamp)}
          </span>
          <span class="item-length">${item.text.length} 字元</span>
        </div>
      </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.clipboard-item').forEach((el, index) => {
      // Click on item to copy
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-btn') || e.target.closest('.action-btn')) {
          return;
        }
        this.copyToClipboard(this.filteredHistory[index].text);
      });

      // Action buttons
      el.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = e.currentTarget.dataset.action;
          const realIndex = this.history.findIndex(h => h.id === this.filteredHistory[index].id);

          switch (action) {
            case 'pin':
              this.pinItem(realIndex);
              break;
            case 'copy':
              this.copyToClipboard(this.filteredHistory[index].text);
              break;
            case 'delete':
              this.deleteItem(realIndex);
              break;
          }
        });
      });
    });
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('✓ 已複製到剪貼簿');
    } catch (error) {
      this.showToast('✗ 複製失敗', 'error');
    }
  }

  async pinItem(index) {
    await chrome.runtime.sendMessage({ action: 'pinItem', index });
    await this.loadHistory();
  }

  async deleteItem(index) {
    await chrome.runtime.sendMessage({ action: 'deleteItem', index });
    await this.loadHistory();
    this.showToast('✓ 已刪除');
  }

  async clearHistory() {
    if (!confirm('確定要清空所有未釘選的項目嗎？')) {
      return;
    }

    await chrome.runtime.sendMessage({ action: 'clearHistory' });
    await this.loadHistory();
    this.showToast('✓ 已清空');
  }

  updateStats() {
    const total = this.history.length;
    const pinned = this.history.filter(item => item.pinned).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayItems = this.history.filter(item => item.timestamp >= today.getTime()).length;

    document.getElementById('totalItems').textContent = total;
    document.getElementById('pinnedItems').textContent = pinned;
    document.getElementById('todayItems').textContent = todayItems;
  }

  updateUI() {
    this.displayHistory();
    this.updateStats();
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;

    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-TW');
  }

  highlightSearch(text) {
    if (!this.searchQuery) return text;

    const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
    return text.replace(regex, '<mark style="background: #667eea; color: white; padding: 0 2px; border-radius: 2px;">$1</mark>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
}

// Initialize
const clipboardManager = new ClipboardManagerPopup();
