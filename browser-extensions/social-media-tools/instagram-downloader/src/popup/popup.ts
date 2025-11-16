/**
 * Instagram Downloader - Popup 腳本
 */

interface DownloadStats {
  totalDownloads: number;
  successfulDownloads: number;
  failedDownloads: number;
}

interface DownloadHistory {
  media: {
    type: 'image' | 'video';
    url: string;
    filename: string;
  };
  downloadedAt: string;
  status: 'success' | 'failed';
}

// DOM 元素
const downloadCurrentBtn = document.getElementById('downloadCurrent') as HTMLButtonElement;
const downloadStoryBtn = document.getElementById('downloadStory') as HTMLButtonElement;
const clearHistoryBtn = document.getElementById('clearHistory') as HTMLButtonElement;
const openSettingsBtn = document.getElementById('openSettings') as HTMLButtonElement;

const totalDownloadsEl = document.getElementById('totalDownloads')!;
const successDownloadsEl = document.getElementById('successDownloads')!;
const failedDownloadsEl = document.getElementById('failedDownloads')!;
const historyListEl = document.getElementById('historyList')!;

/**
 * 初始化
 */
async function init(): Promise<void> {
  await loadStats();
  await loadHistory();
  setupEventListeners();
}

/**
 * 載入統計資料
 */
async function loadStats(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('downloadStats');
    const stats: DownloadStats = result.downloadStats || {
      totalDownloads: 0,
      successfulDownloads: 0,
      failedDownloads: 0
    };

    totalDownloadsEl.textContent = stats.totalDownloads.toString();
    successDownloadsEl.textContent = stats.successfulDownloads.toString();
    failedDownloadsEl.textContent = stats.failedDownloads.toString();
  } catch (error) {
    console.error('載入統計失敗:', error);
  }
}

/**
 * 載入下載歷史
 */
async function loadHistory(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('downloadHistory');
    const history: DownloadHistory[] = result.downloadHistory || [];

    if (history.length === 0) {
      historyListEl.innerHTML = '<p class="empty-state">尚無下載記錄</p>';
      return;
    }

    historyListEl.innerHTML = history
      .slice(0, 5) // 只顯示最近 5 筆
      .map(item => createHistoryItem(item))
      .join('');
  } catch (error) {
    console.error('載入歷史失敗:', error);
  }
}

/**
 * 創建歷史項目 HTML
 */
function createHistoryItem(item: DownloadHistory): string {
  const icon = item.media.type === 'image' ? '🖼️' : '🎬';
  const time = formatTime(item.downloadedAt);
  const statusClass = item.status === 'success' ? 'success' : 'failed';

  return `
    <div class="history-item">
      <div class="history-icon">${icon}</div>
      <div class="history-info">
        <div class="history-filename">${item.media.filename}</div>
        <div class="history-time">${time}</div>
      </div>
      <div class="history-status ${statusClass}"></div>
    </div>
  `;
}

/**
 * 格式化時間
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString('zh-TW');
}

/**
 * 設置事件監聽器
 */
function setupEventListeners(): void {
  // 下載當前貼文
  downloadCurrentBtn.addEventListener('click', async () => {
    downloadCurrentBtn.disabled = true;
    downloadCurrentBtn.innerHTML = '<span class="icon loading">⏳</span> 下載中...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('找不到活動分頁');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'DOWNLOAD_CURRENT_POST'
      });

      if (response.success) {
        showSuccess(`成功下載 ${response.count} 個檔案`);
        await loadStats();
        await loadHistory();
      } else {
        throw new Error(response.error || '下載失敗');
      }
    } catch (error) {
      console.error('下載失敗:', error);
      showError('下載失敗，請確認您在 Instagram 貼文頁面');
    } finally {
      downloadCurrentBtn.disabled = false;
      downloadCurrentBtn.innerHTML = '<span class="icon">⬇️</span> 下載當前貼文';
    }
  });

  // 下載 Story
  downloadStoryBtn.addEventListener('click', async () => {
    downloadStoryBtn.disabled = true;
    downloadStoryBtn.innerHTML = '<span class="icon loading">⏳</span> 下載中...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('找不到活動分頁');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'DOWNLOAD_STORY'
      });

      if (response.success) {
        showSuccess('Story 下載成功');
        await loadStats();
        await loadHistory();
      } else {
        throw new Error(response.error || '下載失敗');
      }
    } catch (error) {
      console.error('Story 下載失敗:', error);
      showError('下載失敗，請確認您在 Instagram Story 頁面');
    } finally {
      downloadStoryBtn.disabled = false;
      downloadStoryBtn.innerHTML = '<span class="icon">📖</span> 下載當前 Story';
    }
  });

  // 清除歷史記錄
  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('確定要清除所有下載歷史記錄嗎？')) {
      try {
        await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
        await loadHistory();
        showSuccess('歷史記錄已清除');
      } catch (error) {
        console.error('清除歷史失敗:', error);
        showError('清除歷史失敗');
      }
    }
  });

  // 開啟設定
  openSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

/**
 * 顯示成功訊息
 */
function showSuccess(message: string): void {
  // TODO: 實作通知或提示訊息
  console.log('成功:', message);
}

/**
 * 顯示錯誤訊息
 */
function showError(message: string): void {
  // TODO: 實作錯誤提示
  console.error('錯誤:', message);
  alert(message);
}

// 初始化
init();
