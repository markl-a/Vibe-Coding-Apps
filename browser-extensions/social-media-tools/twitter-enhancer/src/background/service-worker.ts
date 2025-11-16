/**
 * Twitter/X Enhancer - 背景服務
 */

interface MediaInfo {
  type: 'image' | 'video' | 'gif';
  url: string;
  filename: string;
  thumbnail?: string;
}

/**
 * 監聽訊息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_MEDIA') {
    handleMediaDownload(message.media)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_STATS') {
    getStats()
      .then(stats => sendResponse({ success: true, stats }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * 處理媒體下載
 */
async function handleMediaDownload(mediaList: MediaInfo[]): Promise<void> {
  for (const media of mediaList) {
    try {
      await downloadMedia(media);
      await updateStats('download');
    } catch (error) {
      console.error('下載失敗:', error);
      throw error;
    }
  }
}

/**
 * 下載媒體
 */
async function downloadMedia(media: MediaInfo): Promise<void> {
  try {
    if (media.type === 'image') {
      const blob = await fetchAsBlob(media.url);
      const blobUrl = URL.createObjectURL(blob);

      const downloadId = await chrome.downloads.download({
        url: blobUrl,
        filename: `Twitter/${media.filename}`,
        saveAs: false
      });

      chrome.downloads.onChanged.addListener(function cleanup(delta) {
        if (delta.id === downloadId && delta.state?.current === 'complete') {
          URL.revokeObjectURL(blobUrl);
          chrome.downloads.onChanged.removeListener(cleanup);
        }
      });
    } else {
      await chrome.downloads.download({
        url: media.url,
        filename: `Twitter/${media.filename}`,
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
 * 獲取為 Blob
 */
async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.blob();
}

/**
 * 更新統計
 */
async function updateStats(type: string): Promise<void> {
  const result = await chrome.storage.local.get('stats');
  const stats = result.stats || {
    totalDownloads: 0,
    totalAdsBlocked: 0
  };

  if (type === 'download') {
    stats.totalDownloads += 1;
  } else if (type === 'adBlock') {
    stats.totalAdsBlocked += 1;
  }

  await chrome.storage.local.set({ stats });
}

/**
 * 獲取統計
 */
async function getStats(): Promise<any> {
  const result = await chrome.storage.local.get(['stats', 'adStats']);
  return {
    downloads: result.stats?.totalDownloads || 0,
    adsBlocked: result.adStats?.totalBlocked || 0
  };
}

/**
 * 安裝時初始化
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Twitter/X Enhancer 已安裝');

    chrome.storage.local.set({
      stats: {
        totalDownloads: 0,
        totalAdsBlocked: 0
      },
      adStats: {
        totalBlocked: 0
      },
      settings: {
        blockAds: true,
        enableDownloader: true,
        theme: 'default',
        autoHideRead: false
      }
    });
  }
});

export type { MediaInfo };
