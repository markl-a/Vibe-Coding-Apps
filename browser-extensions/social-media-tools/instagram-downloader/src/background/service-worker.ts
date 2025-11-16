/**
 * Instagram Downloader - 背景服務
 * 處理下載請求和資料儲存
 */

interface MediaInfo {
  type: 'image' | 'video';
  url: string;
  filename: string;
  thumbnail?: string;
}

interface DownloadHistory {
  media: MediaInfo;
  downloadedAt: string;
  status: 'success' | 'failed';
  downloadId?: number;
}

/**
 * 監聽來自內容腳本的訊息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_MEDIA') {
    handleMediaDownload(message.media)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持訊息通道開啟
  }

  if (message.type === 'GET_DOWNLOAD_HISTORY') {
    getDownloadHistory()
      .then(history => sendResponse({ success: true, history }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'CLEAR_HISTORY') {
    clearDownloadHistory()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * 處理媒體下載
 */
async function handleMediaDownload(mediaList: MediaInfo[]): Promise<void> {
  console.log('開始下載', mediaList.length, '個媒體檔案');

  for (const media of mediaList) {
    try {
      await downloadMedia(media);
      await saveDownloadHistory(media, 'success');
    } catch (error) {
      console.error('下載失敗:', error);
      await saveDownloadHistory(media, 'failed');
      throw error;
    }
  }
}

/**
 * 下載單一媒體檔案
 */
async function downloadMedia(media: MediaInfo): Promise<void> {
  try {
    // 對於圖片，我們需要先獲取 blob 以繞過 CORS 限制
    if (media.type === 'image') {
      const blob = await fetchAsBlob(media.url);
      const blobUrl = URL.createObjectURL(blob);

      const downloadId = await chrome.downloads.download({
        url: blobUrl,
        filename: `Instagram/${media.filename}`,
        saveAs: false
      });

      // 下載完成後清理 blob URL
      chrome.downloads.onChanged.addListener(function cleanupBlob(delta) {
        if (delta.id === downloadId && delta.state?.current === 'complete') {
          URL.revokeObjectURL(blobUrl);
          chrome.downloads.onChanged.removeListener(cleanupBlob);
        }
      });
    } else {
      // 影片直接下載
      await chrome.downloads.download({
        url: media.url,
        filename: `Instagram/${media.filename}`,
        saveAs: false
      });
    }

    console.log('下載成功:', media.filename);
  } catch (error) {
    console.error('下載失敗:', media.filename, error);
    throw error;
  }
}

/**
 * 獲取媒體為 Blob
 */
async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.blob();
}

/**
 * 儲存下載歷史
 */
async function saveDownloadHistory(media: MediaInfo, status: 'success' | 'failed'): Promise<void> {
  try {
    const result = await chrome.storage.local.get('downloadHistory');
    const history: DownloadHistory[] = result.downloadHistory || [];

    history.unshift({
      media: media,
      downloadedAt: new Date().toISOString(),
      status: status
    });

    // 只保留最近 200 筆記錄
    if (history.length > 200) {
      history.splice(200);
    }

    await chrome.storage.local.set({ downloadHistory: history });

    // 更新下載統計
    await updateDownloadStats(status);
  } catch (error) {
    console.error('儲存歷史失敗:', error);
  }
}

/**
 * 更新下載統計
 */
async function updateDownloadStats(status: 'success' | 'failed'): Promise<void> {
  const result = await chrome.storage.local.get('downloadStats');
  const stats = result.downloadStats || {
    totalDownloads: 0,
    successfulDownloads: 0,
    failedDownloads: 0
  };

  stats.totalDownloads += 1;
  if (status === 'success') {
    stats.successfulDownloads += 1;
  } else {
    stats.failedDownloads += 1;
  }

  await chrome.storage.local.set({ downloadStats: stats });
}

/**
 * 獲取下載歷史
 */
async function getDownloadHistory(): Promise<DownloadHistory[]> {
  const result = await chrome.storage.local.get('downloadHistory');
  return result.downloadHistory || [];
}

/**
 * 清除下載歷史
 */
async function clearDownloadHistory(): Promise<void> {
  await chrome.storage.local.set({ downloadHistory: [] });
}

/**
 * 監聽擴充功能安裝事件
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Instagram Downloader 已安裝');

    // 初始化儲存
    chrome.storage.local.set({
      downloadHistory: [],
      downloadStats: {
        totalDownloads: 0,
        successfulDownloads: 0,
        failedDownloads: 0
      },
      settings: {
        autoDownload: false,
        downloadQuality: 'high',
        saveLocation: 'Instagram',
        showNotifications: true
      }
    });
  }
});

/**
 * 監聽下載完成事件
 */
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current === 'complete') {
    console.log('下載完成:', delta.id);
    showNotification('下載完成', '媒體檔案已成功儲存');
  } else if (delta.state?.current === 'interrupted') {
    console.error('下載中斷:', delta.id);
    showNotification('下載失敗', '媒體檔案下載失敗');
  }
});

/**
 * 顯示通知
 */
async function showNotification(title: string, message: string): Promise<void> {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || { showNotifications: true };

  if (settings.showNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: title,
      message: message
    });
  }
}

// 匯出型別供其他模組使用
export type { MediaInfo, DownloadHistory };
