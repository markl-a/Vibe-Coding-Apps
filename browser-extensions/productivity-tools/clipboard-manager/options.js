// Clipboard Manager Options Script

class OptionsManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.setupEventListeners();
  }

  async loadSettings() {
    const data = await chrome.storage.local.get(['openaiApiKey']);
    if (data.openaiApiKey) {
      document.getElementById('apiKey').value = data.openaiApiKey;
      this.showStatus('API Key 已設定', 'success');
    }
  }

  async loadStats() {
    const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
    const history = response.history || [];

    const total = history.length;
    const pinned = history.filter(item => item.pinned).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayItems = history.filter(item => item.timestamp >= today.getTime()).length;

    document.getElementById('totalItems').textContent = total;
    document.getElementById('pinnedItems').textContent = pinned;
    document.getElementById('todayItems').textContent = todayItems;
  }

  setupEventListeners() {
    document.getElementById('saveApiBtn').addEventListener('click', () => {
      this.saveApiKey();
    });

    document.getElementById('testApiBtn').addEventListener('click', () => {
      this.testApiConnection();
    });
  }

  async saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!apiKey) {
      this.showStatus('請輸入 API Key', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      this.showStatus('API Key 格式不正確', 'error');
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        action: 'setApiKey',
        apiKey: apiKey
      });

      this.showStatus('✓ API Key 已儲存', 'success');
    } catch (error) {
      this.showStatus('✗ 儲存失敗', 'error');
      console.error(error);
    }
  }

  async testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!apiKey) {
      this.showStatus('請先輸入 API Key', 'error');
      return;
    }

    this.showStatus('正在測試連接...', 'info');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        this.showStatus('✓ API 連接成功！', 'success');
      } else {
        const error = await response.json();
        this.showStatus(`✗ 連接失敗: ${error.error?.message || '未知錯誤'}`, 'error');
      }
    } catch (error) {
      this.showStatus('✗ 連接失敗: 網路錯誤', 'error');
      console.error(error);
    }
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('apiStatus');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;

    if (type !== 'info') {
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 5000);
    }
  }
}

// Initialize
const optionsManager = new OptionsManager();
