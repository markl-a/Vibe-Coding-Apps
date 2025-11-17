// Font Customizer Popup Script
class PopupController {
  constructor() {
    this.settings = {
      fontFamily: 'inherit',
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 1.5,
      letterSpacing: 'normal',
      wordSpacing: 'normal',
      textAlign: 'inherit',
      enabled: false
    };
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI
    this.updateUI();
  }

  async loadSettings() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'getSettings' }, (response) => {
      if (response && response.settings) {
        this.settings = response.settings;
        this.updateUI();
      }
    });
  }

  setupEventListeners() {
    // Toggle switch
    document.getElementById('toggleSwitch').addEventListener('click', () => {
      this.toggleEnabled();
    });

    // Font family
    document.getElementById('fontFamily').addEventListener('change', (e) => {
      this.settings.fontFamily = e.target.value;
      this.applySettings();
    });

    // Font size
    document.getElementById('fontSize').addEventListener('input', (e) => {
      this.settings.fontSize = parseInt(e.target.value);
      document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
      this.applySettings();
    });

    // Font weight
    document.getElementById('fontWeight').addEventListener('change', (e) => {
      this.settings.fontWeight = e.target.value;
      this.applySettings();
    });

    // Line height
    document.getElementById('lineHeight').addEventListener('input', (e) => {
      this.settings.lineHeight = parseFloat(e.target.value);
      document.getElementById('lineHeightValue').textContent = e.target.value;
      this.applySettings();
    });

    // Letter spacing
    document.getElementById('letterSpacing').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.settings.letterSpacing = value === 0 ? 'normal' : `${value}px`;
      document.getElementById('letterSpacingValue').textContent = `${value}px`;
      this.applySettings();
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });

    // Save domain button
    document.getElementById('saveDomainBtn').addEventListener('click', () => {
      this.saveDomainSettings();
    });
  }

  async toggleEnabled() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
      if (response) {
        this.settings.enabled = response.enabled;
        this.updateUI();
      }
    });
  }

  async applySettings() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'updateSettings',
      settings: this.settings
    });

    this.updatePreview();
  }

  async resetSettings() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'resetSettings' }, () => {
      this.settings = {
        fontFamily: 'inherit',
        fontSize: 16,
        fontWeight: 'normal',
        lineHeight: 1.5,
        letterSpacing: 'normal',
        wordSpacing: 'normal',
        textAlign: 'inherit',
        enabled: false
      };
      this.updateUI();
    });
  }

  async saveDomainSettings() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'saveDomainSettings' }, () => {
      // Show success message
      const btn = document.getElementById('saveDomainBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓ 已儲存！';
      btn.style.background = '#10b981';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    });
  }

  updateUI() {
    // Toggle switch
    const toggleSwitch = document.getElementById('toggleSwitch');
    const status = document.getElementById('status');

    if (this.settings.enabled) {
      toggleSwitch.classList.add('active');
      status.textContent = '✓ 字體自訂已啟用';
      status.classList.remove('disabled');
    } else {
      toggleSwitch.classList.remove('active');
      status.textContent = '字體自訂已停用';
      status.classList.add('disabled');
    }

    // Font controls
    document.getElementById('fontFamily').value = this.settings.fontFamily;
    document.getElementById('fontSize').value = this.settings.fontSize;
    document.getElementById('fontSizeValue').textContent = `${this.settings.fontSize}px`;
    document.getElementById('fontWeight').value = this.settings.fontWeight;
    document.getElementById('lineHeight').value = this.settings.lineHeight;
    document.getElementById('lineHeightValue').textContent = this.settings.lineHeight;

    const letterSpacing = this.settings.letterSpacing === 'normal' ? 0 : parseFloat(this.settings.letterSpacing);
    document.getElementById('letterSpacing').value = letterSpacing;
    document.getElementById('letterSpacingValue').textContent = `${letterSpacing}px`;

    this.updatePreview();
  }

  updatePreview() {
    const preview = document.getElementById('previewText');
    const s = this.settings;

    preview.style.fontFamily = s.fontFamily !== 'inherit' ? s.fontFamily : '';
    preview.style.fontSize = `${s.fontSize}px`;
    preview.style.fontWeight = s.fontWeight;
    preview.style.lineHeight = s.lineHeight;
    preview.style.letterSpacing = s.letterSpacing;
  }
}

// Initialize popup
const popup = new PopupController();
