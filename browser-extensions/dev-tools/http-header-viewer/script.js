// HTTP Header Viewer
class HTTPHeaderViewer {
  constructor() {
    this.currentMethod = 'GET';
    this.headers = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Fetch button
    document.getElementById('fetchBtn').addEventListener('click', () => {
      this.fetchHeaders();
    });

    // Enter key on URL input
    document.getElementById('urlInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.fetchHeaders();
      }
    });

    // Method buttons
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentMethod = e.target.dataset.method;
      });
    });

    // Quick URL buttons
    document.querySelectorAll('.quick-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.getElementById('urlInput').value = e.target.dataset.url;
        this.fetchHeaders();
      });
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  async fetchHeaders() {
    const url = document.getElementById('urlInput').value.trim();

    if (!url) {
      this.showError('請輸入有效的網址');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      this.showError('網址格式不正確');
      return;
    }

    this.showLoading();
    this.hideError();

    try {
      const response = await fetch(url, {
        method: this.currentMethod,
        mode: 'cors',
        cache: 'no-cache'
      });

      this.headers = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        type: response.type,
        redirected: response.redirected
      };

      this.displayHeaders();
    } catch (error) {
      this.showError(`請求失敗: ${error.message}<br><small>提示：此工具受到 CORS 政策限制，某些網站可能無法查詢。</small>`);
      this.hideLoading();
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>錯誤：</strong> ${message}`;
    errorDiv.style.display = 'block';
  }

  hideError() {
    document.getElementById('error').style.display = 'none';
  }

  displayHeaders() {
    this.hideLoading();
    document.getElementById('results').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    // Display status info
    const status = this.headers.status;
    document.getElementById('statusCode').innerHTML =
      `<span class="status-badge ${this.getStatusClass(status)}">${status}</span>`;
    document.getElementById('statusText').textContent = this.headers.statusText || '-';
    document.getElementById('method').textContent = this.currentMethod;

    const contentType = this.headers.headers.get('content-type') || '-';
    document.getElementById('contentType').textContent = contentType;

    // Display response headers
    this.displayResponseHeaders();

    // Display request headers
    this.displayRequestHeaders();

    // Display security headers
    this.displaySecurityHeaders();

    // Display raw data
    this.displayRawData();
  }

  getStatusClass(status) {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-warning';
    return 'status-error';
  }

  displayResponseHeaders() {
    const container = document.getElementById('responseHeaders');
    const headers = Array.from(this.headers.headers.entries());

    if (headers.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary)">無回應標頭資訊</p>';
      return;
    }

    container.innerHTML = headers.map(([name, value]) => `
      <div class="header-item">
        <span class="header-name">${this.escapeHtml(name)}</span>
        <span class="header-value">${this.escapeHtml(value)}</span>
        <button class="copy-btn" onclick="httpViewer.copyToClipboard('${this.escapeHtml(value)}')">
          📋 複製
        </button>
      </div>
    `).join('');
  }

  displayRequestHeaders() {
    const container = document.getElementById('requestHeaders');

    const requestHeaders = {
      'User-Agent': navigator.userAgent,
      'Accept': '*/*',
      'Accept-Language': navigator.language,
      'Connection': 'keep-alive',
      'Method': this.currentMethod
    };

    container.innerHTML = Object.entries(requestHeaders).map(([name, value]) => `
      <div class="header-item">
        <span class="header-name">${name}</span>
        <span class="header-value">${this.escapeHtml(value)}</span>
        <button class="copy-btn" onclick="httpViewer.copyToClipboard('${this.escapeHtml(value)}')">
          📋 複製
        </button>
      </div>
    `).join('');
  }

  displaySecurityHeaders() {
    const container = document.getElementById('securityHeaders');

    const securityHeaderNames = [
      'content-security-policy',
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];

    const securityHeaders = [];
    securityHeaderNames.forEach(name => {
      const value = this.headers.headers.get(name);
      if (value) {
        securityHeaders.push([name, value]);
      }
    });

    if (securityHeaders.length === 0) {
      container.innerHTML = `
        <div class="info-card">
          <div class="info-label">⚠️ 警告</div>
          <div class="info-value" style="font-size: 14px; color: var(--warning);">
            未偵測到安全性相關的 HTTP 標頭
          </div>
          <p style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
            建議網站實作以下安全標頭：Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options 等
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = securityHeaders.map(([name, value]) => `
      <div class="header-item">
        <span class="header-name">${name}</span>
        <span class="header-value">${this.escapeHtml(value)}</span>
        <button class="copy-btn" onclick="httpViewer.copyToClipboard('${this.escapeHtml(value)}')">
          📋 複製
        </button>
      </div>
    `).join('');
  }

  displayRawData() {
    const container = document.getElementById('rawData');

    const headers = Array.from(this.headers.headers.entries());
    const raw = {
      status: this.headers.status,
      statusText: this.headers.statusText,
      url: this.headers.url,
      type: this.headers.type,
      redirected: this.headers.redirected,
      headers: Object.fromEntries(headers)
    };

    container.textContent = JSON.stringify(raw, null, 2);
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Show success feedback
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = '✓ 已複製';
      btn.style.background = 'var(--success)';
      btn.style.color = 'white';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
const httpViewer = new HTTPHeaderViewer();
