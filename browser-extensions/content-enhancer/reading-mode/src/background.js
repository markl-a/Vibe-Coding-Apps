// Background Service Worker for Reading Mode Pro

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Reading Mode Pro installed');

    // Set default settings
    chrome.storage.sync.set({
      readingModeSettings: {
        theme: 'light',
        fontSize: 18,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.6,
        maxWidth: 700
      }
    });
  } else if (details.reason === 'update') {
    console.log('Reading Mode Pro updated');
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-reading-mode') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleReadingMode' });
      }
    });
  }
});

// Handle context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'enableReadingMode',
    title: 'Open in Reading Mode',
    contexts: ['selection', 'page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'enableReadingMode') {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleReadingMode' });
  }
});
