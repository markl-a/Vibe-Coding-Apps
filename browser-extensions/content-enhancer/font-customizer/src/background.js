// Font Customizer Background Script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Font Customizer installed');

  // Set default settings
  chrome.storage.sync.get(['fontCustomizerSettings'], (data) => {
    if (!data.fontCustomizerSettings) {
      chrome.storage.sync.set({
        fontCustomizerSettings: {
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 'normal',
          lineHeight: 1.5,
          letterSpacing: 'normal',
          wordSpacing: 'normal',
          textAlign: 'inherit',
          enabled: false
        }
      });
    }
  });
});

// Handle toolbar icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
});
