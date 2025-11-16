// Background Service Worker for Dark Theme Injector

// Default settings
const defaultSettings = {
  darkThemeEnabled: false,
  darkTheme: 'classic',
  darkThemeSettings: {
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    imageFilter: true,
    customColors: null
  },
  domainWhitelist: [],
  domainBlacklist: []
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Dark Theme Injector installed');

    // Set default settings
    await chrome.storage.sync.set(defaultSettings);

  } else if (details.reason === 'update') {
    console.log('Dark Theme Injector updated');

    // Merge with existing settings
    const existing = await chrome.storage.sync.get(Object.keys(defaultSettings));
    const merged = { ...defaultSettings, ...existing };
    await chrome.storage.sync.set(merged);
  }

  // Create context menu
  createContextMenu();
});

// Create context menu items
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'toggleDarkTheme',
      title: 'Toggle Dark Theme',
      contexts: ['page', 'selection']
    });

    chrome.contextMenus.create({
      id: 'addToWhitelist',
      title: 'Always Enable for This Site',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'addToBlacklist',
      title: 'Never Enable for This Site',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const domain = new URL(tab.url).hostname;

  switch (info.menuItemId) {
    case 'toggleDarkTheme':
      chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
      break;

    case 'addToWhitelist':
      await addToDomainList('domainWhitelist', domain);
      chrome.tabs.reload(tab.id);
      break;

    case 'addToBlacklist':
      await addToDomainList('domainBlacklist', domain);
      chrome.tabs.reload(tab.id);
      break;
  }
});

// Add domain to whitelist or blacklist
async function addToDomainList(listName, domain) {
  const data = await chrome.storage.sync.get(listName);
  const list = data[listName] || [];

  if (!list.includes(domain)) {
    list.push(domain);
    await chrome.storage.sync.set({ [listName]: list });
    console.log(`Added ${domain} to ${listName}`);
  }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-dark-theme') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' });
      }
    });
  }
});

// Update badge based on state
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.darkThemeEnabled) {
    updateBadge(changes.darkThemeEnabled.newValue);
  }
});

function updateBadge(enabled) {
  chrome.action.setBadgeText({
    text: enabled ? 'ON' : ''
  });

  chrome.action.setBadgeBackgroundColor({
    color: enabled ? '#4CAF50' : '#666666'
  });
}

// Initialize badge
chrome.storage.sync.get('darkThemeEnabled', (data) => {
  updateBadge(data.darkThemeEnabled || false);
});
