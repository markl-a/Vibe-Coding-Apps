// Popup Script for Reading Mode Pro

let isActive = false;
let currentSettings = {
  theme: 'light',
  fontSize: 18,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.6,
  maxWidth: 700
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const saved = await chrome.storage.sync.get('readingModeSettings');
  if (saved.readingModeSettings) {
    currentSettings = saved.readingModeSettings;
    updateUI();
  }

  // Check current status
  checkStatus();

  // Set up event listeners
  document.getElementById('toggleBtn').addEventListener('click', toggleReadingMode);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
});

async function checkStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    isActive = response.active;
    updateStatusUI();
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

async function toggleReadingMode() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleReadingMode' });
    isActive = response.active;
    updateStatusUI();
  } catch (error) {
    console.error('Error toggling reading mode:', error);
    alert('無法在此頁面啟用閱讀模式');
  }
}

async function saveSettings() {
  const theme = document.getElementById('theme').value;
  const fontSize = parseInt(document.getElementById('fontSize').value);
  const fontFamily = document.getElementById('fontFamily').value;

  currentSettings = {
    ...currentSettings,
    theme,
    fontSize,
    fontFamily
  };

  // Save to storage
  await chrome.storage.sync.set({ readingModeSettings: currentSettings });

  // Update active reading mode if it's on
  if (isActive) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: currentSettings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Show feedback
  const btn = document.getElementById('saveSettings');
  const originalText = btn.textContent;
  btn.textContent = '✓ 已儲存';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 1500);
}

function updateStatusUI() {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');

  if (isActive) {
    statusEl.textContent = '閱讀模式已啟用';
    statusEl.className = 'status active';
    toggleBtn.textContent = '關閉閱讀模式';
  } else {
    statusEl.textContent = '閱讀模式未啟用';
    statusEl.className = 'status inactive';
    toggleBtn.textContent = '啟用閱讀模式';
  }
}

function updateUI() {
  document.getElementById('theme').value = currentSettings.theme;
  document.getElementById('fontSize').value = currentSettings.fontSize;
  document.getElementById('fontFamily').value = currentSettings.fontFamily;
}
