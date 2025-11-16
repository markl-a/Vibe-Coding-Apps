// API Tester Application
class ApiTester {
    constructor() {
        this.headers = {};
        this.history = this.loadHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHistory();
        this.setupAuthFields();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.response-tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchResponseTab(e.target.dataset.tab));
        });

        // Add header button
        document.querySelector('.btn-add-header').addEventListener('click', () => this.addHeader());

        // Send request
        document.getElementById('send-btn').addEventListener('click', () => this.sendRequest());

        // Clear form
        document.getElementById('clear-btn').addEventListener('click', () => this.clearForm());

        // Copy cURL
        document.getElementById('copy-curl-btn').addEventListener('click', () => this.copyCurl());

        // Clear history
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());

        // Auth type change
        document.getElementById('auth-type').addEventListener('change', () => this.setupAuthFields());

        // Enter key to send request
        document.getElementById('url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendRequest();
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    switchResponseTab(tabName) {
        document.querySelectorAll('.response-tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.response-tab-panel').forEach(panel => panel.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    addHeader() {
        const keyInput = document.querySelector('.header-key');
        const valueInput = document.querySelector('.header-value');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();

        if (key && value) {
            this.headers[key] = value;
            this.renderHeaders();
            keyInput.value = '';
            valueInput.value = '';
        }
    }

    renderHeaders() {
        const headersList = document.getElementById('headers-list');
        headersList.innerHTML = '';

        Object.entries(this.headers).forEach(([key, value]) => {
            const headerItem = document.createElement('div');
            headerItem.className = 'header-item';
            headerItem.innerHTML = `
                <input type="text" value="${key}" readonly>
                <input type="text" value="${value}" readonly>
                <button class="btn-remove-header" onclick="apiTester.removeHeader('${key}')">✕</button>
            `;
            headersList.appendChild(headerItem);
        });
    }

    removeHeader(key) {
        delete this.headers[key];
        this.renderHeaders();
    }

    setupAuthFields() {
        const authType = document.getElementById('auth-type').value;
        const authFields = document.getElementById('auth-fields');

        switch (authType) {
            case 'bearer':
                authFields.innerHTML = `
                    <div class="auth-field">
                        <label>Bearer Token</label>
                        <input type="text" id="bearer-token" placeholder="Enter your token">
                    </div>
                `;
                break;
            case 'basic':
                authFields.innerHTML = `
                    <div class="auth-field">
                        <label>Username</label>
                        <input type="text" id="basic-username" placeholder="Username">
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" id="basic-password" placeholder="Password">
                    </div>
                `;
                break;
            case 'apikey':
                authFields.innerHTML = `
                    <div class="auth-field">
                        <label>Key Name</label>
                        <input type="text" id="apikey-name" placeholder="X-API-Key">
                    </div>
                    <div class="auth-field">
                        <label>Key Value</label>
                        <input type="text" id="apikey-value" placeholder="Your API key">
                    </div>
                `;
                break;
            default:
                authFields.innerHTML = '';
        }
    }

    async sendRequest() {
        const method = document.getElementById('method').value;
        const url = document.getElementById('url').value.trim();

        if (!url) {
            alert('請輸入 URL');
            return;
        }

        const sendBtn = document.getElementById('send-btn');
        sendBtn.classList.add('loading');
        sendBtn.disabled = true;

        const startTime = Date.now();

        try {
            // Prepare headers
            const headers = { ...this.headers };
            const authType = document.getElementById('auth-type').value;

            if (authType === 'bearer') {
                const token = document.getElementById('bearer-token')?.value;
                if (token) headers['Authorization'] = `Bearer ${token}`;
            } else if (authType === 'basic') {
                const username = document.getElementById('basic-username')?.value;
                const password = document.getElementById('basic-password')?.value;
                if (username && password) {
                    const encoded = btoa(`${username}:${password}`);
                    headers['Authorization'] = `Basic ${encoded}`;
                }
            } else if (authType === 'apikey') {
                const keyName = document.getElementById('apikey-name')?.value;
                const keyValue = document.getElementById('apikey-value')?.value;
                if (keyName && keyValue) headers[keyName] = keyValue;
            }

            // Prepare body
            let body = null;
            const bodyType = document.getElementById('body-type').value;

            if (['POST', 'PUT', 'PATCH'].includes(method) && bodyType !== 'none') {
                const bodyContent = document.getElementById('request-body').value;

                if (bodyType === 'json') {
                    headers['Content-Type'] = 'application/json';
                    body = bodyContent;
                } else if (bodyType === 'form') {
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    body = bodyContent;
                } else {
                    body = bodyContent;
                }
            }

            // Make request
            const config = {
                method,
                headers,
            };

            if (body) {
                config.body = body;
            }

            const response = await fetch(url, config);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Get response data
            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                responseData = JSON.stringify(responseData, null, 2);
            } else {
                responseData = await response.text();
            }

            // Display response
            this.displayResponse(response, responseData, responseTime);

            // Save to history
            this.saveToHistory({
                method,
                url,
                status: response.status,
                time: new Date().toISOString()
            });

        } catch (error) {
            this.displayError(error);
        } finally {
            sendBtn.classList.remove('loading');
            sendBtn.disabled = false;
        }
    }

    displayResponse(response, data, time) {
        const statusElement = document.getElementById('response-status');
        const bodyElement = document.getElementById('response-body');
        const headersElement = document.getElementById('response-headers');
        const timeElement = document.getElementById('response-time');
        const sizeElement = document.getElementById('response-size');

        // Status
        statusElement.textContent = `${response.status} ${response.statusText}`;
        statusElement.className = 'response-status ' + (response.ok ? 'success' : 'error');

        // Body
        bodyElement.textContent = data;

        // Headers
        const headersObj = {};
        response.headers.forEach((value, key) => {
            headersObj[key] = value;
        });
        headersElement.textContent = JSON.stringify(headersObj, null, 2);

        // Time and size
        timeElement.textContent = `⏱️ 時間: ${time}ms`;
        const size = new Blob([data]).size;
        sizeElement.textContent = `📦 大小: ${this.formatBytes(size)}`;
    }

    displayError(error) {
        const statusElement = document.getElementById('response-status');
        const bodyElement = document.getElementById('response-body');

        statusElement.textContent = '❌ 請求失敗';
        statusElement.className = 'response-status error';
        bodyElement.textContent = `錯誤: ${error.message}`;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    copyCurl() {
        const method = document.getElementById('method').value;
        const url = document.getElementById('url').value.trim();

        if (!url) {
            alert('請先輸入 URL');
            return;
        }

        let curl = `curl -X ${method}`;

        // Add headers
        Object.entries(this.headers).forEach(([key, value]) => {
            curl += ` \\\n  -H "${key}: ${value}"`;
        });

        // Add auth
        const authType = document.getElementById('auth-type').value;
        if (authType === 'bearer') {
            const token = document.getElementById('bearer-token')?.value;
            if (token) curl += ` \\\n  -H "Authorization: Bearer ${token}"`;
        }

        // Add body
        const bodyType = document.getElementById('body-type').value;
        if (['POST', 'PUT', 'PATCH'].includes(method) && bodyType !== 'none') {
            const body = document.getElementById('request-body').value;
            if (body) curl += ` \\\n  -d '${body}'`;
        }

        curl += ` \\\n  "${url}"`;

        navigator.clipboard.writeText(curl).then(() => {
            alert('cURL 指令已複製到剪貼簿！');
        });
    }

    clearForm() {
        document.getElementById('method').value = 'GET';
        document.getElementById('url').value = '';
        document.getElementById('request-body').value = '';
        document.getElementById('body-type').value = 'none';
        document.getElementById('auth-type').value = 'none';
        this.headers = {};
        this.renderHeaders();
        this.setupAuthFields();

        // Clear response
        document.getElementById('response-status').className = 'response-status';
        document.getElementById('response-body').textContent = '等待發送請求...';
        document.getElementById('response-headers').textContent = '';
        document.getElementById('response-time').textContent = '';
        document.getElementById('response-size').textContent = '';
    }

    saveToHistory(request) {
        this.history.unshift(request);
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        localStorage.setItem('api-tester-history', JSON.stringify(this.history));
        this.renderHistory();
    }

    loadHistory() {
        const saved = localStorage.getItem('api-tester-history');
        return saved ? JSON.parse(saved) : [];
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');

        if (this.history.length === 0) {
            historyList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">尚無歷史記錄</p>';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="apiTester.loadFromHistory('${item.url}', '${item.method}')">
                <span class="history-method method-${item.method}">${item.method}</span>
                <span class="history-url">${item.url}</span>
                <div class="history-time">
                    ${new Date(item.time).toLocaleString('zh-TW')} - Status: ${item.status}
                </div>
            </div>
        `).join('');
    }

    loadFromHistory(url, method) {
        document.getElementById('url').value = url;
        document.getElementById('method').value = method;
    }

    clearHistory() {
        if (confirm('確定要清除所有歷史記錄嗎？')) {
            this.history = [];
            localStorage.removeItem('api-tester-history');
            this.renderHistory();
        }
    }
}

// Initialize app
const apiTester = new ApiTester();
