// Background Service Worker for Text Highlighter Pro

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Text Highlighter Pro installed');
  }

  // Create context menus
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'highlightText',
      title: 'Highlight Text',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'highlightWithNote',
      title: 'Highlight with Note',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'viewHighlights',
      title: 'View All Highlights',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'highlightText':
      chrome.tabs.sendMessage(tab.id, { action: 'highlightSelection' });
      break;

    case 'highlightWithNote':
      chrome.tabs.sendMessage(tab.id, { action: 'addNote' });
      break;

    case 'viewHighlights':
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
      break;
  }
});
