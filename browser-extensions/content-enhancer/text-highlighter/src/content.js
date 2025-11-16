// Text Highlighter Pro - Content Script

class TextHighlighter {
  constructor() {
    this.highlights = [];
    this.colors = {
      yellow: '#ffeb3b',
      green: '#4caf50',
      blue: '#2196f3',
      red: '#f44336',
      purple: '#9c27b0'
    };
    this.currentColor = 'yellow';
    this.toolbar = null;
    this.sidebar = null;
    this.init();
  }

  async init() {
    // Load saved highlights for this page
    await this.loadHighlights();

    // Apply saved highlights
    this.applyHighlights();

    // Set up selection listener
    document.addEventListener('mouseup', (e) => this.handleSelection(e));

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true;
    });

    // Create sidebar
    this.createSidebar();
  }

  async loadHighlights() {
    const url = window.location.href;
    const key = `highlights-${this.hashUrl(url)}`;

    const data = await chrome.storage.sync.get(key);
    if (data[key]) {
      this.highlights = data[key];
    }
  }

  async saveHighlights() {
    const url = window.location.href;
    const key = `highlights-${this.hashUrl(url)}`;

    await chrome.storage.sync.set({
      [key]: this.highlights
    });
  }

  handleSelection(e) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length === 0) {
      this.hideToolbar();
      return;
    }

    // Don't show toolbar if clicking on existing highlight
    if (e.target.classList.contains('text-highlight')) {
      return;
    }

    // Show highlight toolbar
    this.showToolbar(selection);
  }

  showToolbar(selection) {
    if (!this.toolbar) {
      this.createToolbar();
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position toolbar above selection
    this.toolbar.style.left = rect.left + window.scrollX + 'px';
    this.toolbar.style.top = rect.top + window.scrollY - 50 + 'px';
    this.toolbar.style.display = 'flex';
  }

  hideToolbar() {
    if (this.toolbar) {
      this.toolbar.style.display = 'none';
    }
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'text-highlighter-toolbar';
    this.toolbar.innerHTML = `
      <button class="hl-btn" data-color="yellow" style="background: #ffeb3b;">黃</button>
      <button class="hl-btn" data-color="green" style="background: #4caf50;">綠</button>
      <button class="hl-btn" data-color="blue" style="background: #2196f3;">藍</button>
      <button class="hl-btn" data-color="red" style="background: #f44336;">紅</button>
      <button class="hl-btn" data-color="purple" style="background: #9c27b0;">紫</button>
      <button class="hl-btn hl-note-btn">📝</button>
    `;

    document.body.appendChild(this.toolbar);

    // Event listeners
    this.toolbar.querySelectorAll('.hl-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (btn.classList.contains('hl-note-btn')) {
          this.addNote();
        } else {
          const color = btn.dataset.color;
          this.highlightSelection(color);
        }

        this.hideToolbar();
      });
    });
  }

  highlightSelection(color) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();

    if (text.length === 0) return;

    // Create highlight
    const highlight = {
      id: this.generateId(),
      text: text,
      color: color,
      note: '',
      timestamp: Date.now(),
      range: this.serializeRange(range)
    };

    this.highlights.push(highlight);
    this.saveHighlights();

    // Apply highlight to DOM
    this.applyHighlight(highlight, range);

    // Clear selection
    selection.removeAllRanges();

    // Update sidebar
    this.updateSidebar();
  }

  applyHighlight(highlight, range) {
    if (!range) {
      range = this.deserializeRange(highlight.range);
      if (!range) return;
    }

    try {
      const span = document.createElement('span');
      span.className = 'text-highlight';
      span.dataset.highlightId = highlight.id;
      span.style.backgroundColor = this.colors[highlight.color];
      span.style.cursor = 'pointer';

      range.surroundContents(span);

      // Click to view/edit note
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showNotePopup(highlight);
      });

      // Right-click menu
      span.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e, highlight);
      });

    } catch (error) {
      console.error('Failed to apply highlight:', error);
    }
  }

  applyHighlights() {
    this.highlights.forEach(highlight => {
      this.applyHighlight(highlight);
    });
  }

  addNote() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const text = selection.toString().trim();
    if (text.length === 0) return;

    const note = prompt('新增筆記:', '');
    if (note !== null) {
      this.highlightSelection(this.currentColor);

      // Add note to last highlight
      const lastHighlight = this.highlights[this.highlights.length - 1];
      lastHighlight.note = note;
      this.saveHighlights();
    }
  }

  showNotePopup(highlight) {
    const popup = document.createElement('div');
    popup.className = 'text-highlight-popup';
    popup.innerHTML = `
      <div class="popup-header">
        <strong>高亮筆記</strong>
        <button class="popup-close">✕</button>
      </div>
      <div class="popup-body">
        <p class="highlight-text">"${highlight.text}"</p>
        <textarea class="highlight-note" placeholder="新增筆記...">${highlight.note || ''}</textarea>
      </div>
      <div class="popup-footer">
        <button class="btn-save">儲存</button>
        <button class="btn-delete">刪除</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Position near the highlight
    const highlightEl = document.querySelector(`[data-highlight-id="${highlight.id}"]`);
    if (highlightEl) {
      const rect = highlightEl.getBoundingClientRect();
      popup.style.left = rect.left + window.scrollX + 'px';
      popup.style.top = rect.bottom + window.scrollY + 10 + 'px';
    }

    // Event listeners
    popup.querySelector('.popup-close').addEventListener('click', () => popup.remove());

    popup.querySelector('.btn-save').addEventListener('click', () => {
      highlight.note = popup.querySelector('.highlight-note').value;
      this.saveHighlights();
      this.updateSidebar();
      popup.remove();
    });

    popup.querySelector('.btn-delete').addEventListener('click', () => {
      this.deleteHighlight(highlight.id);
      popup.remove();
    });
  }

  deleteHighlight(id) {
    // Remove from array
    this.highlights = this.highlights.filter(h => h.id !== id);
    this.saveHighlights();

    // Remove from DOM
    const element = document.querySelector(`[data-highlight-id="${id}"]`);
    if (element) {
      const parent = element.parentNode;
      const text = document.createTextNode(element.textContent);
      parent.replaceChild(text, element);
    }

    this.updateSidebar();
  }

  createSidebar() {
    this.sidebar = document.createElement('div');
    this.sidebar.className = 'text-highlighter-sidebar';
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>高亮列表</h3>
        <button class="sidebar-close">✕</button>
      </div>
      <div class="sidebar-content">
        <div class="highlights-list"></div>
      </div>
      <div class="sidebar-footer">
        <button class="btn-export">匯出</button>
        <button class="btn-clear">清除全部</button>
      </div>
    `;

    document.body.appendChild(this.sidebar);

    // Event listeners
    this.sidebar.querySelector('.sidebar-close').addEventListener('click', () => {
      this.sidebar.classList.remove('active');
    });

    this.sidebar.querySelector('.btn-export').addEventListener('click', () => {
      this.exportHighlights();
    });

    this.sidebar.querySelector('.btn-clear').addEventListener('click', () => {
      if (confirm('確定要清除所有高亮嗎?')) {
        this.clearAllHighlights();
      }
    });

    this.updateSidebar();
  }

  updateSidebar() {
    const list = this.sidebar.querySelector('.highlights-list');
    if (!list) return;

    if (this.highlights.length === 0) {
      list.innerHTML = '<p class="empty-state">尚無高亮內容</p>';
      return;
    }

    list.innerHTML = this.highlights.map(h => `
      <div class="highlight-item" data-id="${h.id}">
        <div class="highlight-color" style="background: ${this.colors[h.color]};"></div>
        <div class="highlight-content">
          <p class="highlight-text">"${h.text.substring(0, 100)}${h.text.length > 100 ? '...' : ''}"</p>
          ${h.note ? `<p class="highlight-note-preview">📝 ${h.note}</p>` : ''}
        </div>
      </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.highlight-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const highlight = this.highlights.find(h => h.id === id);
        if (highlight) {
          this.showNotePopup(highlight);
        }
      });
    });
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('active');
  }

  exportHighlights() {
    const content = this.highlights.map(h => {
      return `[${h.color}] ${h.text}\n${h.note ? `筆記: ${h.note}\n` : ''}\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearAllHighlights() {
    // Remove from DOM
    document.querySelectorAll('.text-highlight').forEach(el => {
      const parent = el.parentNode;
      const text = document.createTextNode(el.textContent);
      parent.replaceChild(text, el);
    });

    // Clear array and storage
    this.highlights = [];
    this.saveHighlights();
    this.updateSidebar();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        this.toggleSidebar();
      } else if (e.altKey && e.key === 'h') {
        e.preventDefault();
        this.highlightSelection(this.currentColor);
      } else if (e.altKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const colors = ['yellow', 'green', 'blue', 'red', 'purple'];
        const color = colors[parseInt(e.key) - 1];
        this.highlightSelection(color);
      }
    });
  }

  serializeRange(range) {
    return {
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      startContainer: this.getNodePath(range.startContainer),
      endContainer: this.getNodePath(range.endContainer)
    };
  }

  deserializeRange(data) {
    try {
      const startNode = this.getNodeByPath(data.startContainer);
      const endNode = this.getNodeByPath(data.endContainer);

      if (!startNode || !endNode) return null;

      const range = document.createRange();
      range.setStart(startNode, data.startOffset);
      range.setEnd(endNode, data.endOffset);

      return range;
    } catch (error) {
      return null;
    }
  }

  getNodePath(node) {
    const path = [];
    while (node && node !== document.body) {
      const parent = node.parentNode;
      const index = Array.from(parent.childNodes).indexOf(node);
      path.unshift(index);
      node = parent;
    }
    return path;
  }

  getNodeByPath(path) {
    let node = document.body;
    for (const index of path) {
      if (!node.childNodes[index]) return null;
      node = node.childNodes[index];
    }
    return node;
  }

  generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'toggleSidebar':
        this.toggleSidebar();
        sendResponse({ success: true });
        break;

      case 'getHighlightCount':
        sendResponse({ count: this.highlights.length });
        break;
    }
  }
}

// Initialize
const textHighlighter = new TextHighlighter();
