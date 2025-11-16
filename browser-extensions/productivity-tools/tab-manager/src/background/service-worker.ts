// Background service worker for Tab Manager

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'search-tabs') {
    chrome.action.openPopup();
  }
});

// Auto-suspend inactive tabs (if enabled)
let suspendCheckInterval: NodeJS.Timeout | null = null;

async function checkAndSuspendTabs() {
  const result = await chrome.storage.local.get(['tabManagerSettings']);
  const settings = result.tabManagerSettings;

  if (!settings?.autoSuspendEnabled) return;

  const tabs = await chrome.tabs.query({});
  const now = Date.now();

  for (const tab of tabs) {
    if (tab.active || tab.pinned || !tab.id) continue;

    // Check last accessed time (this would need to be tracked)
    // For simplicity, we'll skip the actual suspend implementation here
    // In a real implementation, you'd track tab access times
  }
}

// Start suspend check interval
function startSuspendCheck() {
  if (suspendCheckInterval) {
    clearInterval(suspendCheckInterval);
  }

  // Check every 5 minutes
  suspendCheckInterval = setInterval(checkAndSuspendTabs, 5 * 60 * 1000);
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.tabManagerSettings) {
    const newSettings = changes.tabManagerSettings.newValue;
    if (newSettings?.autoSuspendEnabled) {
      startSuspendCheck();
    } else if (suspendCheckInterval) {
      clearInterval(suspendCheckInterval);
      suspendCheckInterval = null;
    }
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Manager Extension installed');
});
