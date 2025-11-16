// Background service worker for Quick Notes

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-quick-notes',
    title: 'Save to Quick Notes',
    contexts: ['selection'],
  });

  console.log('Quick Notes Extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-quick-notes' && info.selectionText) {
    // Create a new note with selected text
    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title: extractTitle(info.selectionText),
      content: info.selectionText,
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      tags: [],
    };

    // Save to storage
    const result = await chrome.storage.local.get(['notes']);
    const notes = result.notes || [];
    notes.unshift(note);
    await chrome.storage.local.set({ notes });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Note Saved!',
      message: 'Your selection has been saved to Quick Notes',
    });
  }
});

function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  if (!firstLine) return 'Untitled Note';
  const title = firstLine.replace(/^#+\s*/, '');
  return title.length > 50 ? title.substring(0, 50) + '...' : title;
}
