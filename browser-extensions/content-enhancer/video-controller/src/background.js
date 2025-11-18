// Background Service Worker for Video Controller Pro

const defaultSettings = {
  defaultSpeed: 1.0,
  skipShort: 5,
  skipMedium: 10,
  skipLong: 30,
  volumeStep: 5,
  rememberPosition: true,
  aiFeatures: {
    enableSubtitles: true,
    enableSummary: true,
    autoDetectLanguage: true
  }
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Video Controller Pro installed');
    await chrome.storage.sync.set({ videoControllerSettings: defaultSettings });

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon-128.png',
      title: 'Video Controller Pro Installed!',
      message: 'Enhanced video controls with AI features are now active. Try the new AI summary and subtitle features!'
    });
  } else if (details.reason === 'update') {
    console.log('Video Controller Pro updated to', chrome.runtime.getManifest().version);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'downloadImage':
      handleDownload(request.url, request.filename || `screenshot-${Date.now()}.png`);
      sendResponse({ success: true });
      break;

    case 'getSettings':
      chrome.storage.sync.get('videoControllerSettings', (data) => {
        sendResponse({ settings: data.videoControllerSettings || defaultSettings });
      });
      return true; // Keep channel open for async response

    case 'updateSettings':
      chrome.storage.sync.set({ videoControllerSettings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'recordVideoStats':
      recordVideoStatistics(request.stats);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'executeCommand',
        command: command
      });
    }
  });
});

// Helper function to download files
async function handleDownload(url, filename) {
  try {
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });
  } catch (error) {
    console.error('Download failed:', error);
  }
}

// Record video viewing statistics
async function recordVideoStatistics(stats) {
  const key = 'videoStatistics';
  const data = await chrome.storage.local.get(key);
  const statistics = data[key] || {
    totalVideosWatched: 0,
    totalWatchTime: 0,
    screenshotsTaken: 0,
    lastUpdated: Date.now()
  };

  // Update statistics
  if (stats.videoCompleted) statistics.totalVideosWatched++;
  if (stats.watchTime) statistics.totalWatchTime += stats.watchTime;
  if (stats.screenshotTaken) statistics.screenshotsTaken++;
  statistics.lastUpdated = Date.now();

  await chrome.storage.local.set({ [key]: statistics });
}

// Context menu for video elements
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'vc-screenshot',
    title: 'Take Video Screenshot',
    contexts: ['video']
  });

  chrome.contextMenus.create({
    id: 'vc-pip',
    title: 'Open in Picture-in-Picture',
    contexts: ['video']
  });

  chrome.contextMenus.create({
    id: 'vc-ai-summary',
    title: 'Generate AI Summary',
    contexts: ['video']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: 'contextMenuAction',
    menuItemId: info.menuItemId
  });
});
