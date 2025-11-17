// Font Customizer Content Script
class FontCustomizer {
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
    this.styleElement = null;
    this.init();
  }

  async init() {
    // Load saved settings
    const data = await chrome.storage.sync.get(['fontCustomizerSettings', 'fontCustomizerEnabled']);

    if (data.fontCustomizerSettings) {
      this.settings = { ...this.settings, ...data.fontCustomizerSettings };
    }

    if (data.fontCustomizerEnabled !== undefined) {
      this.settings.enabled = data.fontCustomizerEnabled;
    }

    // Check if domain is in whitelist
    await this.checkDomainSettings();

    // Apply settings if enabled
    if (this.settings.enabled) {
      this.applySettings();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true;
    });

    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+F to toggle
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  async checkDomainSettings() {
    const currentDomain = window.location.hostname;
    const data = await chrome.storage.sync.get('domainSettings');

    if (data.domainSettings && data.domainSettings[currentDomain]) {
      this.settings = { ...this.settings, ...data.domainSettings[currentDomain] };
    }
  }

  handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'toggle':
        this.toggle();
        sendResponse({ enabled: this.settings.enabled });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        if (this.settings.enabled) {
          this.applySettings();
        }
        this.saveSettings();
        sendResponse({ success: true });
        break;

      case 'getSettings':
        sendResponse({ settings: this.settings });
        break;

      case 'resetSettings':
        this.resetSettings();
        sendResponse({ success: true });
        break;

      case 'saveDomainSettings':
        this.saveDomainSettings();
        sendResponse({ success: true });
        break;
    }
  }

  toggle() {
    this.settings.enabled = !this.settings.enabled;

    if (this.settings.enabled) {
      this.applySettings();
    } else {
      this.removeSettings();
    }

    this.saveSettings();
  }

  applySettings() {
    // Remove existing style element if present
    this.removeSettings();

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'font-customizer-style';
    this.styleElement.textContent = this.generateCSS();

    // Inject into document
    document.head.appendChild(this.styleElement);

    // Add visual indicator
    document.documentElement.classList.add('font-customizer-active');
  }

  removeSettings() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    document.documentElement.classList.remove('font-customizer-active');
  }

  generateCSS() {
    const s = this.settings;

    let css = `
      /* Font Customizer Styles */
      html.font-customizer-active * {
        ${s.fontFamily !== 'inherit' ? `font-family: ${s.fontFamily} !important;` : ''}
        ${s.fontSize !== 16 ? `font-size: ${s.fontSize}px !important;` : ''}
        ${s.fontWeight !== 'normal' ? `font-weight: ${s.fontWeight} !important;` : ''}
        ${s.lineHeight !== 1.5 ? `line-height: ${s.lineHeight} !important;` : ''}
        ${s.letterSpacing !== 'normal' ? `letter-spacing: ${s.letterSpacing} !important;` : ''}
        ${s.wordSpacing !== 'normal' ? `word-spacing: ${s.wordSpacing} !important;` : ''}
        ${s.textAlign !== 'inherit' ? `text-align: ${s.textAlign} !important;` : ''}
      }

      /* Preserve monospace for code elements */
      html.font-customizer-active code,
      html.font-customizer-active pre,
      html.font-customizer-active kbd,
      html.font-customizer-active samp {
        font-family: 'Courier New', Courier, monospace !important;
      }
    `;

    return css;
  }

  resetSettings() {
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

    this.removeSettings();
    this.saveSettings();
  }

  async saveSettings() {
    await chrome.storage.sync.set({
      fontCustomizerSettings: this.settings,
      fontCustomizerEnabled: this.settings.enabled
    });
  }

  async saveDomainSettings() {
    const currentDomain = window.location.hostname;
    const data = await chrome.storage.sync.get('domainSettings');
    const domainSettings = data.domainSettings || {};

    domainSettings[currentDomain] = { ...this.settings };

    await chrome.storage.sync.set({ domainSettings });
  }
}

// Initialize
const fontCustomizer = new FontCustomizer();
