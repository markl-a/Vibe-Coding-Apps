// Reading Mode Content Script
class ReadingMode {
  constructor() {
    this.isActive = false;
    this.originalContent = null;
    this.settings = {
      theme: 'light',
      fontSize: 18,
      fontFamily: 'Georgia, serif',
      lineHeight: 1.6,
      maxWidth: 700
    };
    this.init();
  }

  async init() {
    // Load saved settings
    const saved = await chrome.storage.sync.get('readingModeSettings');
    if (saved.readingModeSettings) {
      this.settings = { ...this.settings, ...saved.readingModeSettings };
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleReadingMode') {
        this.toggle();
        sendResponse({ active: this.isActive });
      } else if (request.action === 'updateSettings') {
        this.updateSettings(request.settings);
        sendResponse({ success: true });
      } else if (request.action === 'getStatus') {
        sendResponse({ active: this.isActive });
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        this.toggle();
      } else if (e.altKey && e.key === 't') {
        e.preventDefault();
        this.cycleTheme();
      }
    });
  }

  toggle() {
    if (this.isActive) {
      this.disable();
    } else {
      this.enable();
    }
  }

  enable() {
    // Extract main content
    const article = this.extractMainContent();
    if (!article) {
      console.warn('Could not extract main content');
      return;
    }

    // Save original state
    this.originalContent = {
      body: document.body.innerHTML,
      overflow: document.body.style.overflow
    };

    // Create reading mode container
    const container = document.createElement('div');
    container.id = 'reading-mode-container';
    container.className = `reading-mode-theme-${this.settings.theme}`;

    const header = this.createHeader();
    const content = this.createContent(article);
    const controls = this.createControls();

    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(controls);

    // Replace body content
    document.body.innerHTML = '';
    document.body.appendChild(container);
    document.body.style.overflow = 'auto';
    document.body.classList.add('reading-mode-active');

    this.isActive = true;
    this.applySettings();
  }

  disable() {
    if (!this.originalContent) return;

    // Restore original content
    document.body.innerHTML = this.originalContent.body;
    document.body.style.overflow = this.originalContent.overflow;
    document.body.classList.remove('reading-mode-active');

    this.isActive = false;
    this.originalContent = null;
  }

  extractMainContent() {
    // Try to find main content using common selectors
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 200) {
        return element.cloneNode(true);
      }
    }

    // Fallback: find the element with most text content
    const candidates = document.querySelectorAll('div, section, article');
    let bestCandidate = null;
    let maxLength = 0;

    candidates.forEach(el => {
      const textLength = el.textContent.trim().length;
      if (textLength > maxLength && textLength > 200) {
        maxLength = textLength;
        bestCandidate = el;
      }
    });

    return bestCandidate ? bestCandidate.cloneNode(true) : null;
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'reading-mode-header';
    header.innerHTML = `
      <div class="reading-mode-title">
        <h1>${document.title}</h1>
      </div>
      <button class="reading-mode-close" id="reading-mode-close">✕</button>
    `;

    header.querySelector('#reading-mode-close').addEventListener('click', () => {
      this.disable();
    });

    return header;
  }

  createContent(article) {
    const content = document.createElement('div');
    content.className = 'reading-mode-content';
    content.id = 'reading-mode-article';

    // Clean up the article
    this.cleanContent(article);
    content.appendChild(article);

    return content;
  }

  cleanContent(element) {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'iframe', 'nav', 'aside',
      '.advertisement', '.ads', '.social-share',
      '.comments', '.related-posts'
    ];

    unwantedSelectors.forEach(selector => {
      element.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Clean attributes
    element.querySelectorAll('*').forEach(el => {
      const keepAttrs = ['href', 'src', 'alt', 'title'];
      Array.from(el.attributes).forEach(attr => {
        if (!keepAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'reading-mode-controls';
    controls.innerHTML = `
      <div class="control-group">
        <button id="font-decrease" title="Decrease font size">A-</button>
        <button id="font-increase" title="Increase font size">A+</button>
      </div>
      <div class="control-group">
        <button id="theme-toggle" title="Toggle theme">🌓</button>
        <button id="tts-toggle" title="Text-to-speech">🔊</button>
      </div>
    `;

    controls.querySelector('#font-decrease').addEventListener('click', () => {
      this.settings.fontSize = Math.max(12, this.settings.fontSize - 2);
      this.applySettings();
    });

    controls.querySelector('#font-increase').addEventListener('click', () => {
      this.settings.fontSize = Math.min(32, this.settings.fontSize + 2);
      this.applySettings();
    });

    controls.querySelector('#theme-toggle').addEventListener('click', () => {
      this.cycleTheme();
    });

    controls.querySelector('#tts-toggle').addEventListener('click', () => {
      this.toggleTTS();
    });

    return controls;
  }

  cycleTheme() {
    const themes = ['light', 'dark', 'sepia'];
    const currentIndex = themes.indexOf(this.settings.theme);
    this.settings.theme = themes[(currentIndex + 1) % themes.length];

    const container = document.getElementById('reading-mode-container');
    if (container) {
      container.className = `reading-mode-theme-${this.settings.theme}`;
    }

    this.saveSettings();
  }

  toggleTTS() {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const article = document.getElementById('reading-mode-article');
        if (article) {
          const text = article.textContent;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  }

  applySettings() {
    const content = document.getElementById('reading-mode-article');
    if (content) {
      content.style.fontSize = `${this.settings.fontSize}px`;
      content.style.fontFamily = this.settings.fontFamily;
      content.style.lineHeight = this.settings.lineHeight;
      content.style.maxWidth = `${this.settings.maxWidth}px`;
    }
    this.saveSettings();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  async saveSettings() {
    await chrome.storage.sync.set({ readingModeSettings: this.settings });
  }
}

// Initialize
const readingMode = new ReadingMode();
