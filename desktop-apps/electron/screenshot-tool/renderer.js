// 全域變數
let config = {};

// DOM 元素
const fullScreenBtn = document.getElementById('fullScreenBtn');
const regionBtn = document.getElementById('regionBtn');
const windowBtn = document.getElementById('windowBtn');
const settingsBtn = document.getElementById('settingsBtn');
const themeBtn = document.getElementById('themeBtn');
const historyGrid = document.getElementById('historyGrid');
const settingsSection = document.getElementById('settingsSection');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// 初始化
async function init() {
  await loadConfig();
  await loadHistory();
  setupEventListeners();
  applyTheme(config.theme || 'light');
}

// 載入設定
async function loadConfig() {
  config = await window.electronAPI.getConfig();
  updateSettingsForm();
}

// 更新設定表單
function updateSettingsForm() {
  document.getElementById('saveFolder').value = config.saveFolder || '';
  document.getElementById('fileFormat').value = config.fileFormat || 'png';
  document.getElementById('fileName').value = config.fileName || 'Screenshot_%Y%m%d_%H%M%S';
  document.getElementById('autoCopy').checked = config.autoCopy !== false;
  document.getElementById('showNotification').checked = config.showNotification !== false;
  document.getElementById('showCursor').checked = config.showCursor || false;
  document.getElementById('quality').value = config.quality || 100;
  document.getElementById('qualityValue').textContent = config.quality || 100;
}

// 事件監聽器
function setupEventListeners() {
  fullScreenBtn.addEventListener('click', async () => {
    await window.electronAPI.captureFullScreen();
  });

  regionBtn.addEventListener('click', async () => {
    await window.electronAPI.captureRegion();
  });

  windowBtn.addEventListener('click', async () => {
    await window.electronAPI.captureWindow();
  });

  settingsBtn.addEventListener('click', toggleSettings);
  closeSettingsBtn.addEventListener('click', () => {
    settingsSection.style.display = 'none';
  });

  themeBtn.addEventListener('click', toggleTheme);

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('確定要清除所有歷史記錄嗎？')) {
      await window.electronAPI.clearHistory();
      await loadHistory();
    }
  });

  saveSettingsBtn.addEventListener('click', saveSettings);

  document.getElementById('quality').addEventListener('input', (e) => {
    document.getElementById('qualityValue').textContent = e.target.value;
  });

  window.electronAPI.onShowSettings(() => {
    toggleSettings();
  });
}

// 載入歷史記錄
async function loadHistory() {
  const history = await window.electronAPI.getHistory();

  if (history.length === 0) {
    historyGrid.innerHTML = '<div class="empty-state">尚無截圖記錄</div>';
    return;
  }

  historyGrid.innerHTML = history.map(item => `
    <div class="history-item" data-path="${item.path}" title="${new Date(item.timestamp).toLocaleString()}">
      <img src="${item.thumbnail}" alt="Screenshot" />
    </div>
  `).join('');

  // 添加點擊事件
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const path = item.dataset.path;
      require('electron').shell.openPath(path);
    });
  });
}

// 主題切換
function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  config.theme = newTheme;
  window.electronAPI.setConfig('config', config);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    themeBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    themeBtn.textContent = '🌙';
  }
}

// 設定面板
function toggleSettings() {
  const isVisible = settingsSection.style.display === 'block';
  settingsSection.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    updateSettingsForm();
  }
}

async function saveSettings() {
  config.saveFolder = document.getElementById('saveFolder').value;
  config.fileFormat = document.getElementById('fileFormat').value;
  config.fileName = document.getElementById('fileName').value;
  config.autoCopy = document.getElementById('autoCopy').checked;
  config.showNotification = document.getElementById('showNotification').checked;
  config.showCursor = document.getElementById('showCursor').checked;
  config.quality = parseInt(document.getElementById('quality').value);

  await window.electronAPI.setConfig('config', config);
  settingsSection.style.display = 'none';
  alert('設定已儲存');
}

// 啟動
init();
