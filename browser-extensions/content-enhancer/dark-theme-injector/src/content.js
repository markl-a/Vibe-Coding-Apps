// Dark Theme Injector Content Script

class DarkThemeInjector {
  constructor() {
    this.isEnabled = false;
    this.currentTheme = 'classic';
    this.settings = {
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      sepia: 0,
      imageFilter: true,
      customColors: null
    };
    this.observer = null;
    this.init();
  }

  async init() {
    // Load settings from storage
    const data = await chrome.storage.sync.get(['darkThemeEnabled', 'darkThemeSettings', 'darkTheme']);

    if (data.darkThemeEnabled !== undefined) {
      this.isEnabled = data.darkThemeEnabled;
    }

    if (data.darkTheme) {
      this.currentTheme = data.darkTheme;
    }

    if (data.darkThemeSettings) {
      this.settings = { ...this.settings, ...data.darkThemeSettings };
    }

    // Check if current domain is in whitelist/blacklist
    await this.checkDomainRules();

    // Apply theme if enabled
    if (this.isEnabled) {
      this.applyTheme();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true; // Keep channel open for async response
    });

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  async checkDomainRules() {
    const currentDomain = window.location.hostname;
    const data = await chrome.storage.sync.get(['domainWhitelist', 'domainBlacklist']);

    // Check blacklist first
    if (data.domainBlacklist && data.domainBlacklist.includes(currentDomain)) {
      this.isEnabled = false;
      return;
    }

    // Check whitelist
    if (data.domainWhitelist && data.domainWhitelist.length > 0) {
      this.isEnabled = data.domainWhitelist.includes(currentDomain);
    }
  }

  handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'toggle':
        this.toggle();
        sendResponse({ enabled: this.isEnabled });
        break;

      case 'setTheme':
        this.currentTheme = request.theme;
        if (this.isEnabled) {
          this.applyTheme();
        }
        sendResponse({ success: true });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        if (this.isEnabled) {
          this.applyFilters();
        }
        sendResponse({ success: true });
        break;

      case 'getStatus':
        sendResponse({
          enabled: this.isEnabled,
          theme: this.currentTheme,
          settings: this.settings
        });
        break;
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;

    if (this.isEnabled) {
      this.applyTheme();
    } else {
      this.removeTheme();
    }

    // Save state
    chrome.storage.sync.set({ darkThemeEnabled: this.isEnabled });
  }

  applyTheme() {
    // Remove existing theme first
    this.removeTheme();

    // Create and inject theme container
    const themeContainer = document.createElement('div');
    themeContainer.id = 'dark-theme-injector-container';
    themeContainer.setAttribute('data-theme', this.currentTheme);

    // Get theme colors
    const colors = this.getThemeColors(this.currentTheme);

    // Create style element
    const style = document.createElement('style');
    style.id = 'dark-theme-injector-style';
    style.textContent = this.generateCSS(colors);

    // Inject into document
    document.documentElement.appendChild(themeContainer);
    document.head.appendChild(style);

    // Apply CSS variables to root
    this.applyCSSVariables(colors);

    // Apply filters
    this.applyFilters();

    // Set up mutation observer to handle dynamic content
    this.setupObserver();

    // Add class to html element
    document.documentElement.classList.add('dark-theme-active');
  }

  removeTheme() {
    // Remove theme elements
    const container = document.getElementById('dark-theme-injector-container');
    if (container) {
      container.remove();
    }

    const style = document.getElementById('dark-theme-injector-style');
    if (style) {
      style.remove();
    }

    // Remove CSS variables
    const root = document.documentElement;
    const vars = [
      '--dt-bg-primary', '--dt-bg-secondary', '--dt-text-primary',
      '--dt-text-secondary', '--dt-link', '--dt-border', '--dt-shadow'
    ];
    vars.forEach(v => root.style.removeProperty(v));

    // Remove filter
    document.documentElement.style.removeProperty('filter');

    // Remove class
    document.documentElement.classList.remove('dark-theme-active');

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getThemeColors(themeName) {
    const themes = {
      classic: {
        bgPrimary: '#1a1a1a',
        bgSecondary: '#2a2a2a',
        textPrimary: '#e0e0e0',
        textSecondary: '#b0b0b0',
        link: '#4da6ff',
        border: '#3a3a3a',
        shadow: 'rgba(0, 0, 0, 0.5)'
      },
      midnight: {
        bgPrimary: '#0d1117',
        bgSecondary: '#161b22',
        textPrimary: '#c9d1d9',
        textSecondary: '#8b949e',
        link: '#58a6ff',
        border: '#30363d',
        shadow: 'rgba(0, 0, 0, 0.6)'
      },
      warm: {
        bgPrimary: '#2b2420',
        bgSecondary: '#3a322b',
        textPrimary: '#e8d5c4',
        textSecondary: '#c4b5a0',
        link: '#ff9d6e',
        border: '#4a3f35',
        shadow: 'rgba(0, 0, 0, 0.5)'
      },
      highContrast: {
        bgPrimary: '#000000',
        bgSecondary: '#1a1a1a',
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
        link: '#00ffff',
        border: '#ffffff',
        shadow: 'rgba(0, 0, 0, 0.8)'
      },
      oled: {
        bgPrimary: '#000000',
        bgSecondary: '#0a0a0a',
        textPrimary: '#e0e0e0',
        textSecondary: '#a0a0a0',
        link: '#3d9eff',
        border: '#1a1a1a',
        shadow: 'rgba(0, 0, 0, 0.9)'
      }
    };

    return themes[themeName] || themes.classic;
  }

  generateCSS(colors) {
    return `
      /* Dark Theme Injector Styles */

      html.dark-theme-active {
        background-color: ${colors.bgPrimary} !important;
        color-scheme: dark;
      }

      html.dark-theme-active body {
        background-color: ${colors.bgPrimary} !important;
        color: ${colors.textPrimary} !important;
      }

      html.dark-theme-active div,
      html.dark-theme-active section,
      html.dark-theme-active article,
      html.dark-theme-active aside,
      html.dark-theme-active header,
      html.dark-theme-active footer,
      html.dark-theme-active nav,
      html.dark-theme-active main {
        background-color: ${colors.bgPrimary} !important;
        color: ${colors.textPrimary} !important;
        border-color: ${colors.border} !important;
      }

      html.dark-theme-active h1,
      html.dark-theme-active h2,
      html.dark-theme-active h3,
      html.dark-theme-active h4,
      html.dark-theme-active h5,
      html.dark-theme-active h6,
      html.dark-theme-active p,
      html.dark-theme-active span,
      html.dark-theme-active li {
        color: ${colors.textPrimary} !important;
      }

      html.dark-theme-active a {
        color: ${colors.link} !important;
      }

      html.dark-theme-active input,
      html.dark-theme-active textarea,
      html.dark-theme-active select {
        background-color: ${colors.bgSecondary} !important;
        color: ${colors.textPrimary} !important;
        border-color: ${colors.border} !important;
      }

      html.dark-theme-active button {
        background-color: ${colors.bgSecondary} !important;
        color: ${colors.textPrimary} !important;
        border-color: ${colors.border} !important;
      }

      html.dark-theme-active table {
        background-color: ${colors.bgPrimary} !important;
        color: ${colors.textPrimary} !important;
      }

      html.dark-theme-active th,
      html.dark-theme-active td {
        background-color: ${colors.bgSecondary} !important;
        color: ${colors.textPrimary} !important;
        border-color: ${colors.border} !important;
      }

      html.dark-theme-active code,
      html.dark-theme-active pre {
        background-color: ${colors.bgSecondary} !important;
        color: ${colors.textPrimary} !important;
      }

      html.dark-theme-active blockquote {
        border-left-color: ${colors.border} !important;
        color: ${colors.textSecondary} !important;
      }

      /* Image filter */
      html.dark-theme-active img:not([src*=".svg"]) {
        opacity: 0.85;
      }

      html.dark-theme-active img[src*=".svg"] {
        filter: invert(1) hue-rotate(180deg);
      }
    `;
  }

  applyCSSVariables(colors) {
    const root = document.documentElement;
    root.style.setProperty('--dt-bg-primary', colors.bgPrimary);
    root.style.setProperty('--dt-bg-secondary', colors.bgSecondary);
    root.style.setProperty('--dt-text-primary', colors.textPrimary);
    root.style.setProperty('--dt-text-secondary', colors.textSecondary);
    root.style.setProperty('--dt-link', colors.link);
    root.style.setProperty('--dt-border', colors.border);
    root.style.setProperty('--dt-shadow', colors.shadow);
  }

  applyFilters() {
    const filters = [];

    if (this.settings.brightness !== 100) {
      filters.push(`brightness(${this.settings.brightness}%)`);
    }

    if (this.settings.contrast !== 100) {
      filters.push(`contrast(${this.settings.contrast}%)`);
    }

    if (this.settings.grayscale > 0) {
      filters.push(`grayscale(${this.settings.grayscale}%)`);
    }

    if (this.settings.sepia > 0) {
      filters.push(`sepia(${this.settings.sepia}%)`);
    }

    if (filters.length > 0) {
      document.documentElement.style.filter = filters.join(' ');
    }
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      // Handle dynamically added content
      requestIdleCallback(() => {
        // Re-apply theme if needed
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+D to toggle
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
}

// Initialize
const darkThemeInjector = new DarkThemeInjector();
