// Clipboard Manager Background Script
// Enhanced with AI capabilities

// Import AI service
importScripts('services/ai.js');

let clipboardHistory = [];
const MAX_HISTORY = 100;
const ai = aiService;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Clipboard Manager Pro installed');

  // Load existing history
  const data = await chrome.storage.local.get(['clipboardHistory']);
  if (data.clipboardHistory) {
    clipboardHistory = data.clipboardHistory;
  }

  // Create context menu
  chrome.contextMenus.create({
    id: 'viewHistory',
    title: '查看剪貼簿歷史',
    contexts: ['all']
  });

  chrome.contextMenus.create({
    id: 'clearHistory',
    title: '清空剪貼簿歷史',
    contexts: ['all']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'viewHistory') {
    chrome.action.openPopup();
  } else if (info.menuItemId === 'clearHistory') {
    clearHistory();
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'addToClipboard':
      addToHistory(request.text, request.type || 'text');
      sendResponse({ success: true });
      break;

    case 'getHistory':
      sendResponse({ history: clipboardHistory });
      break;

    case 'clearHistory':
      clearHistory();
      sendResponse({ success: true });
      break;

    case 'deleteItem':
      deleteItem(request.index);
      sendResponse({ success: true });
      break;

    case 'pinItem':
      pinItem(request.index);
      sendResponse({ success: true });
      break;

    // AI-related actions
    case 'translateItem':
      (async () => {
        try {
          const item = clipboardHistory[request.index];
          if (item) {
            const translated = await ai.translateText(item.text, request.targetLang);
            sendResponse({ success: true, translated });
          } else {
            sendResponse({ success: false, error: 'Item not found' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'improveFormatting':
      (async () => {
        try {
          const item = clipboardHistory[request.index];
          if (item) {
            const improved = await ai.improveFormatting(item.text);
            sendResponse({ success: true, improved });
          } else {
            sendResponse({ success: false, error: 'Item not found' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'summarizeItem':
      (async () => {
        try {
          const item = clipboardHistory[request.index];
          if (item) {
            const summary = await ai.summarize(item.text, request.maxLength || 100);
            sendResponse({ success: true, summary });
          } else {
            sendResponse({ success: false, error: 'Item not found' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'findSimilar':
      (async () => {
        try {
          const item = clipboardHistory[request.index];
          if (item) {
            const similar = ai.findSimilarItems(item.text, clipboardHistory);
            sendResponse({ success: true, similar });
          } else {
            sendResponse({ success: false, error: 'Item not found' });
          }
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'setApiKey':
      (async () => {
        try {
          await ai.setApiKey(request.apiKey);
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

    case 'getCategorized':
      (async () => {
        try {
          const categorized = await ai.categorizeItems(clipboardHistory);
          sendResponse({ success: true, categorized });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
  }
  return true;
});

// Functions
async function addToHistory(text, type = 'text') {
  if (!text || text.trim() === '') return;

  // Check if already exists (avoid duplicates)
  const existingIndex = clipboardHistory.findIndex(item => item.text === text);
  if (existingIndex !== -1) {
    // Move to top
    const item = clipboardHistory.splice(existingIndex, 1)[0];
    item.timestamp = Date.now();
    item.accessCount = (item.accessCount || 0) + 1;
    clipboardHistory.unshift(item);
  } else {
    // AI-powered content detection
    const detectedType = await ai.detectContentType(text);
    const sensitiveInfo = ai.detectSensitiveInfo(text);
    const tags = await ai.generateTags(text);
    const category = await ai.detectCategory(text, detectedType);

    // Add new item with AI metadata
    const item = {
      text: text,
      type: detectedType || type,
      timestamp: Date.now(),
      pinned: false,
      id: generateId(),
      category: category,
      tags: tags,
      sensitive: sensitiveInfo.hasSensitiveInfo,
      sensitiveTypes: sensitiveInfo.types || [],
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // Warn if sensitive
    if (item.sensitive) {
      console.warn('Sensitive information detected:', item.sensitiveTypes);
      // Optionally show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '⚠️ 敏感資訊警告',
        message: '偵測到可能包含敏感資訊的內容已被複製'
      });
    }

    clipboardHistory.unshift(item);

    // Keep only MAX_HISTORY items (excluding pinned)
    const unpinned = clipboardHistory.filter(item => !item.pinned);
    const pinned = clipboardHistory.filter(item => item.pinned);

    if (unpinned.length > MAX_HISTORY) {
      clipboardHistory = [...pinned, ...unpinned.slice(0, MAX_HISTORY)];
    }
  }

  // Save to storage
  await chrome.storage.local.set({ clipboardHistory });
}

async function clearHistory() {
  // Keep only pinned items
  clipboardHistory = clipboardHistory.filter(item => item.pinned);
  await chrome.storage.local.set({ clipboardHistory });
}

async function deleteItem(index) {
  clipboardHistory.splice(index, 1);
  await chrome.storage.local.set({ clipboardHistory });
}

async function pinItem(index) {
  if (clipboardHistory[index]) {
    clipboardHistory[index].pinned = !clipboardHistory[index].pinned;
    await chrome.storage.local.set({ clipboardHistory });
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Monitor clipboard (periodic check)
setInterval(async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && clipboardHistory[0]?.text !== text) {
      await addToHistory(text);
    }
  } catch (error) {
    // Clipboard read permission not granted or not available
  }
}, 2000);
