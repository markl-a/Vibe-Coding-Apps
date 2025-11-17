// Clipboard Manager Background Script

let clipboardHistory = [];
const MAX_HISTORY = 100;

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
    clipboardHistory.unshift(item);
  } else {
    // Add new item
    const item = {
      text: text,
      type: type,
      timestamp: Date.now(),
      pinned: false,
      id: generateId()
    };

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
