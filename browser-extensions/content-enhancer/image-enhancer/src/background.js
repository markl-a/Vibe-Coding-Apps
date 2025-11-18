// Background Service Worker for Image Enhancer Pro

// Default settings
const defaultSettings = {
  hoverZoom: true,
  zoomLevel: 2,
  showInfo: true,
  aiAnalysis: true, // Enable AI analysis
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0
  }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Image Enhancer Pro installed');
    await chrome.storage.sync.set({ imageEnhancerSettings: defaultSettings });
  } else if (details.reason === 'update') {
    console.log('Image Enhancer Pro updated');
    const existing = await chrome.storage.sync.get('imageEnhancerSettings');
    if (existing.imageEnhancerSettings) {
      const merged = { ...defaultSettings, ...existing.imageEnhancerSettings };
      await chrome.storage.sync.set({ imageEnhancerSettings: merged });
    }
  }

  // Create context menus
  createContextMenus();
});

// Create context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'downloadImage',
      title: 'Download Image',
      contexts: ['image']
    });

    chrome.contextMenus.create({
      id: 'downloadAllImages',
      title: 'Download All Images on Page',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'copyImageUrl',
      title: 'Copy Image URL',
      contexts: ['image']
    });

    chrome.contextMenus.create({
      id: 'openImageNewTab',
      title: 'Open Image in New Tab',
      contexts: ['image']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'downloadImage':
      if (info.srcUrl) {
        downloadImage(info.srcUrl);
      }
      break;

    case 'downloadAllImages':
      chrome.tabs.sendMessage(tab.id, { action: 'downloadAllImages', minSize: 100 });
      break;

    case 'copyImageUrl':
      if (info.srcUrl) {
        // Copy to clipboard using modern API
        try {
          await navigator.clipboard.writeText(info.srcUrl);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      }
      break;

    case 'openImageNewTab':
      if (info.srcUrl) {
        chrome.tabs.create({ url: info.srcUrl });
      }
      break;
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadImage') {
    downloadImage(request.url);
    sendResponse({ success: true });
  }
  return true;
});

// Download image function
function downloadImage(url) {
  const filename = getFilenameFromUrl(url);

  chrome.downloads.download({
    url: url,
    filename: `images/${filename}`,
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);
    } else {
      console.log('Download started:', downloadId);
    }
  });
}

// Extract filename from URL
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = pathname.substring(pathname.lastIndexOf('/') + 1);

    // If no filename, generate one
    if (!filename || !filename.includes('.')) {
      const timestamp = new Date().getTime();
      filename = `image-${timestamp}.jpg`;
    }

    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    return filename;
  } catch (error) {
    const timestamp = new Date().getTime();
    return `image-${timestamp}.jpg`;
  }
}

// Handle keyboard shortcuts (if configured in manifest)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'download-all-images') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'downloadAllImages' });
      }
    });
  }
});
