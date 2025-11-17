let currentFilter = 'all';
let allHistory = [];

// DOM 元素
const historyList = document.getElementById('historyList');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');
const settingsBtn = document.getElementById('settingsBtn');
const clearBtn = document.getElementById('clearBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const maxHistoryInput = document.getElementById('maxHistory');
const checkIntervalInput = document.getElementById('checkInterval');
const globalShortcutInput = document.getElementById('globalShortcut');

// 初始化
async function init() {
  // 載入歷史記錄
  await loadHistory();

  // 載入設定
  await loadConfig();

  // 監聽歷史記錄更新
  window.api.onHistoryUpdated((history) => {
    allHistory = history;
    renderHistory();
  });
}

// 載入歷史記錄
async function loadHistory() {
  allHistory = await window.api.getHistory();
  renderHistory();
}

// 載入設定
async function loadConfig() {
  const config = await window.api.getConfig();
  maxHistoryInput.value = config.maxHistory;
  checkIntervalInput.value = config.checkInterval;
  globalShortcutInput.value = config.globalShortcut;
}

// 渲染歷史記錄
function renderHistory() {
  // 過濾歷史記錄
  let filtered = [...allHistory];

  if (currentFilter === 'favorites') {
    filtered = filtered.filter(item => item.favorite);
  } else if (currentFilter === 'text') {
    filtered = filtered.filter(item => item.type === 'text');
  }

  // 如果沒有記錄，顯示空狀態
  if (filtered.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>沒有找到記錄</p>
        <p class="empty-hint">${currentFilter === 'favorites' ? '點擊星號圖示收藏項目' : '複製一些文字開始使用！'}</p>
      </div>
    `;
    return;
  }

  // 渲染項目
  historyList.innerHTML = filtered.map(item => createHistoryItemHTML(item)).join('');

  // 添加事件監聽器
  attachEventListeners();
}

// 建立歷史記錄項目 HTML
function createHistoryItemHTML(item) {
  const date = new Date(item.timestamp);
  const timeString = formatRelativeTime(date);
  const preview = item.content.substring(0, 100);

  return `
    <div class="history-item" data-id="${item.id}">
      <div class="item-header">
        <button class="btn btn-icon favorite-btn ${item.favorite ? 'active' : ''}" data-id="${item.id}">
          ${item.favorite ? '⭐' : '☆'}
        </button>
        <span class="item-time">${timeString}</span>
        <button class="btn btn-icon delete-btn" data-id="${item.id}">🗑️</button>
      </div>
      <div class="item-content" data-id="${item.id}">
        <p class="item-preview">${escapeHtml(preview)}</p>
        ${item.content.length > 100 ? '<span class="more-indicator">...</span>' : ''}
      </div>
      <div class="item-footer">
        <button class="btn btn-sm copy-btn" data-id="${item.id}">📋 複製</button>
        <span class="item-type">${item.type}</span>
        <span class="item-length">${item.content.length} 字元</span>
      </div>
    </div>
  `;
}

// 附加事件監聽器
function attachEventListeners() {
  // 複製按鈕
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = allHistory.find(i => i.id === id);
      if (item) {
        await window.api.copyToClipboard(item.content);
        showNotification('已複製到剪貼簿');
      }
    });
  });

  // 刪除按鈕
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      await window.api.deleteItem(id);
      showNotification('已刪除');
    });
  });

  // 收藏按鈕
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      await window.api.toggleFavorite(id);
    });
  });

  // 點擊項目內容複製
  document.querySelectorAll('.item-content').forEach(content => {
    content.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = allHistory.find(i => i.id === id);
      if (item) {
        await window.api.copyToClipboard(item.content);
        showNotification('已複製到剪貼簿');
      }
    });
  });
}

// 搜尋
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value;
  allHistory = await window.api.searchHistory(query);
  renderHistory();
});

// 分類標籤
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderHistory();
  });
});

// 清除全部
clearBtn.addEventListener('click', async () => {
  if (confirm('確定要清除所有歷史記錄嗎？此操作無法復原。')) {
    await window.api.clearHistory();
    showNotification('已清除所有記錄');
  }
});

// 設定對話框
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

saveSettings.addEventListener('click', async () => {
  const config = {
    maxHistory: parseInt(maxHistoryInput.value),
    checkInterval: parseInt(checkIntervalInput.value),
    globalShortcut: globalShortcutInput.value
  };

  await window.api.setConfig(config);
  settingsModal.style.display = 'none';
  showNotification('設定已儲存');
});

// 點擊模態框外部關閉
window.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
});

// 工具函數

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

// 初始化應用
init();
