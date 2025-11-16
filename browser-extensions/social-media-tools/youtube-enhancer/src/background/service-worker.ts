/**
 * YouTube Enhancer - 背景服務
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_VIDEO') {
    handleVideoDownload(message)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * 處理影片下載
 */
async function handleVideoDownload(params: any): Promise<void> {
  const { videoId, quality, title } = params;

  // 注意：實際的影片下載需要額外的 API 或服務
  // 這裡僅示範如何觸發下載
  console.log('下載影片:', { videoId, quality, title });

  // 可以使用第三方 API 或 youtube-dl 等工具
  // 這裡僅作為範例
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'YouTube Enhancer',
    message: `準備下載: ${title} (${quality})`
  });
}

/**
 * 安裝時初始化
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    settings: {
      skipAds: true,
      enableDownloader: true,
      customSpeed: true,
      volumeBoost: false
    },
    stats: {
      adsSkipped: 0,
      videosDownloaded: 0
    }
  });
});
