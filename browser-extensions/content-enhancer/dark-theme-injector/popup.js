// Popup Script for Dark Theme Injector

let currentTheme = 'classic';
let settings = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  await loadSettings();

  // Setup event listeners
  setupEventListeners();

  // Check current status
  await checkStatus();
});

async function loadSettings() {
  const data = await chrome.storage.sync.get(['darkTheme', 'darkThemeSettings', 'darkThemeEnabled']);

  if (data.darkTheme) {
    currentTheme = data.darkTheme;
  }

  if (data.darkThemeSettings) {
    settings = { ...settings, ...data.darkThemeSettings };
  }

  // Update UI
  updateThemeUI();
  updateSlidersUI();

  if (data.darkThemeEnabled) {
    document.getElementById('mainToggle').checked = true;
  }
}

function setupEventListeners() {
  // Main toggle
  document.getElementById('mainToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ darkThemeEnabled: enabled });

    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
      if (response) {
        updateStatusBar(response.enabled);
      }
    });
  });

  // Theme selection
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', async () => {
      const theme = option.getAttribute('data-theme');
      await selectTheme(theme);
    });
  });

  // Brightness slider
  document.getElementById('brightness').addEventListener('input', (e) => {
    const value = e.target.value;
    settings.brightness = parseInt(value);
    document.getElementById('brightnessValue').textContent = value + '%';
    updateSettings();
  });

  // Contrast slider
  document.getElementById('contrast').addEventListener('input', (e) => {
    const value = e.target.value;
    settings.contrast = parseInt(value);
    document.getElementById('contrastValue').textContent = value + '%';
    updateSettings();
  });

  // Grayscale slider
  document.getElementById('grayscale').addEventListener('input', (e) => {
    const value = e.target.value;
    settings.grayscale = parseInt(value);
    document.getElementById('grayscaleValue').textContent = value + '%';
    updateSettings();
  });

  // Sepia slider
  document.getElementById('sepia').addEventListener('input', (e) => {
    const value = e.target.value;
    settings.sepia = parseInt(value);
    document.getElementById('sepiaValue').textContent = value + '%';
    updateSettings();
  });
}

async function selectTheme(theme) {
  currentTheme = theme;

  // Save to storage
  await chrome.storage.sync.set({ darkTheme: theme });

  // Update UI
  updateThemeUI();

  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'setTheme',
    theme: theme
  });
}

async function updateSettings() {
  // Save to storage
  await chrome.storage.sync.set({ darkThemeSettings: settings });

  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'updateSettings',
    settings: settings
  });
}

function updateThemeUI() {
  document.querySelectorAll('.theme-option').forEach(option => {
    const theme = option.getAttribute('data-theme');
    if (theme === currentTheme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function updateSlidersUI() {
  document.getElementById('brightness').value = settings.brightness;
  document.getElementById('brightnessValue').textContent = settings.brightness + '%';

  document.getElementById('contrast').value = settings.contrast;
  document.getElementById('contrastValue').textContent = settings.contrast + '%';

  document.getElementById('grayscale').value = settings.grayscale;
  document.getElementById('grayscaleValue').textContent = settings.grayscale + '%';

  document.getElementById('sepia').value = settings.sepia;
  document.getElementById('sepiaValue').textContent = settings.sepia + '%';
}

async function checkStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });

    if (response) {
      updateStatusBar(response.enabled);
      if (response.theme) {
        currentTheme = response.theme;
        updateThemeUI();
      }
      if (response.settings) {
        settings = response.settings;
        updateSlidersUI();
      }
    }
  } catch (error) {
    console.log('Could not check status:', error);
  }
}

function updateStatusBar(enabled) {
  const statusBar = document.getElementById('statusBar');

  if (enabled) {
    statusBar.textContent = '深色主題已啟用';
    statusBar.className = 'status-bar';
  } else {
    statusBar.textContent = '深色主題已停用';
    statusBar.className = 'status-bar inactive';
  }
}
