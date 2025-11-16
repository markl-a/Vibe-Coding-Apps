// JSON Formatter Application
class JSONFormatter {
    constructor() {
        this.jsonInput = document.getElementById('json-input');
        this.jsonOutput = document.getElementById('json-output');
        this.realTimeEnabled = false;
        this.currentJSON = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.loadExamples();
    }

    setupEventListeners() {
        // Tool buttons
        document.getElementById('format-btn').addEventListener('click', () => this.formatJSON());
        document.getElementById('minify-btn').addEventListener('click', () => this.minifyJSON());
        document.getElementById('validate-btn').addEventListener('click', () => this.validateJSON());
        document.getElementById('escape-btn').addEventListener('click', () => this.escapeJSON());
        document.getElementById('unescape-btn').addEventListener('click', () => this.unescapeJSON());
        document.getElementById('sort-btn').addEventListener('click', () => this.sortJSON());

        // Action buttons
        document.getElementById('paste-btn').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('clear-input-btn').addEventListener('click', () => this.clearInput());
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadJSON());

        // JSONPath
        document.getElementById('jsonpath-query-btn').addEventListener('click', () => this.queryJSONPath());
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('jsonpath-input').value = e.target.dataset.path;
                this.queryJSONPath();
            });
        });

        // Input events
        this.jsonInput.addEventListener('input', () => {
            this.updateStats();
            if (this.realTimeEnabled) {
                this.formatJSON();
            }
        });

        // Options
        document.getElementById('real-time-option').addEventListener('change', (e) => {
            this.realTimeEnabled = e.target.checked;
            if (this.realTimeEnabled) {
                this.formatJSON();
            }
        });

        // Example cards
        document.querySelectorAll('.example-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const example = e.currentTarget.dataset.example;
                this.loadExample(example);
            });
        });
    }

    updateStats() {
        const text = this.jsonInput.value;
        const chars = text.length;
        const lines = text.split('\n').length;

        document.getElementById('input-chars').textContent = `字元數: ${chars}`;
        document.getElementById('input-lines').textContent = `行數: ${lines}`;
    }

    formatJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入 JSON 資料', 'error');
                return;
            }

            const parsed = JSON.parse(input);
            this.currentJSON = parsed;

            const indentSize = document.getElementById('indent-size').value;
            const sortKeys = document.getElementById('sort-keys-option').checked;

            let result;
            if (sortKeys) {
                result = JSON.stringify(this.sortObjectKeys(parsed), null,
                    indentSize === 'tab' ? '\t' : parseInt(indentSize));
            } else {
                result = JSON.stringify(parsed, null,
                    indentSize === 'tab' ? '\t' : parseInt(indentSize));
            }

            this.displayOutput(result);
            this.updateValidationStatus(true);
            this.showMessage('格式化成功', 'success');
        } catch (error) {
            this.showError(error);
            this.updateValidationStatus(false, error.message);
        }
    }

    minifyJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入 JSON 資料', 'error');
                return;
            }

            const parsed = JSON.parse(input);
            this.currentJSON = parsed;
            const result = JSON.stringify(parsed);

            this.displayOutput(result);
            this.updateValidationStatus(true);
            this.showMessage('壓縮成功', 'success');
        } catch (error) {
            this.showError(error);
            this.updateValidationStatus(false, error.message);
        }
    }

    validateJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入 JSON 資料', 'error');
                return;
            }

            const parsed = JSON.parse(input);
            this.currentJSON = parsed;
            this.updateValidationStatus(true);
            this.showMessage('✓ JSON 語法正確', 'success');
        } catch (error) {
            this.updateValidationStatus(false, error.message);
            this.showMessage(`✗ JSON 語法錯誤: ${error.message}`, 'error');
        }
    }

    escapeJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入 JSON 資料', 'error');
                return;
            }

            // First validate it's valid JSON
            JSON.parse(input);

            // Escape the JSON string
            const escaped = JSON.stringify(input);
            this.displayOutput(escaped);
            this.showMessage('轉義成功', 'success');
        } catch (error) {
            this.showError(error);
        }
    }

    unescapeJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入已轉義的 JSON 字串', 'error');
                return;
            }

            // Unescape the string
            const unescaped = JSON.parse(input);
            this.displayOutput(unescaped);
            this.showMessage('反轉義成功', 'success');
        } catch (error) {
            this.showMessage('反轉義失敗: 請確認輸入的是有效的轉義字串', 'error');
        }
    }

    sortJSON() {
        try {
            const input = this.jsonInput.value.trim();
            if (!input) {
                this.showMessage('請輸入 JSON 資料', 'error');
                return;
            }

            const parsed = JSON.parse(input);
            const sorted = this.sortObjectKeys(parsed);

            const indentSize = document.getElementById('indent-size').value;
            const result = JSON.stringify(sorted, null,
                indentSize === 'tab' ? '\t' : parseInt(indentSize));

            this.displayOutput(result);
            this.updateValidationStatus(true);
            this.showMessage('排序成功', 'success');
        } catch (error) {
            this.showError(error);
        }
    }

    sortObjectKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).sort().reduce((result, key) => {
                result[key] = this.sortObjectKeys(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }

    queryJSONPath() {
        const path = document.getElementById('jsonpath-input').value.trim();
        const resultDiv = document.getElementById('jsonpath-result');

        if (!this.currentJSON) {
            resultDiv.textContent = '請先格式化或驗證 JSON 資料';
            return;
        }

        if (!path) {
            resultDiv.textContent = '請輸入 JSONPath 查詢語句';
            return;
        }

        try {
            const result = this.evaluateJSONPath(this.currentJSON, path);
            resultDiv.textContent = JSON.stringify(result, null, 2);
        } catch (error) {
            resultDiv.textContent = `查詢錯誤: ${error.message}`;
        }
    }

    // Simple JSONPath implementation (supports basic queries)
    evaluateJSONPath(obj, path) {
        if (path === '$') return obj;

        // Remove $ prefix
        path = path.replace(/^\$\.?/, '');

        if (!path) return obj;

        // Split path into parts
        const parts = path.split('.');
        let result = obj;

        for (const part of parts) {
            if (part === '*') {
                // Get all values
                if (Array.isArray(result)) {
                    return result;
                } else if (typeof result === 'object') {
                    return Object.values(result);
                }
            } else if (part.includes('[') && part.includes(']')) {
                // Array access
                const key = part.substring(0, part.indexOf('['));
                const index = parseInt(part.match(/\[(\d+)\]/)[1]);

                if (key) result = result[key];
                result = result[index];
            } else {
                result = result[part];
            }

            if (result === undefined) {
                throw new Error(`路徑不存在: ${part}`);
            }
        }

        return result;
    }

    displayOutput(text) {
        this.jsonOutput.textContent = text;
        const chars = text.length;
        document.getElementById('output-chars').textContent = `字元數: ${chars}`;
    }

    updateValidationStatus(valid, message = '') {
        const badge = document.getElementById('validation-status');
        if (valid) {
            badge.textContent = '✓ 有效 JSON';
            badge.className = 'status-badge valid';
        } else {
            badge.textContent = '✗ 無效 JSON';
            badge.className = 'status-badge invalid';
            badge.title = message;
        }
    }

    showError(error) {
        const errorMsg = this.parseJSONError(error);
        this.jsonOutput.textContent = errorMsg;
        this.updateValidationStatus(false, error.message);
    }

    parseJSONError(error) {
        const message = error.message;
        const match = message.match(/position (\d+)/);

        if (match) {
            const position = parseInt(match[1]);
            const input = this.jsonInput.value;
            const lines = input.substring(0, position).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;

            return `❌ JSON 語法錯誤

位置: 第 ${line} 行，第 ${column} 列
錯誤: ${message}

提示:
• 檢查是否有未閉合的引號
• 檢查是否有多餘的逗號
• 檢查括號是否配對
• 鍵名必須用雙引號包圍`;
        }

        return `❌ JSON 語法錯誤\n\n${message}`;
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.jsonInput.value = text;
            this.updateStats();
            this.showMessage('已從剪貼簿貼上', 'success');
        } catch (error) {
            this.showMessage('無法從剪貼簿讀取', 'error');
        }
    }

    clearInput() {
        this.jsonInput.value = '';
        this.jsonOutput.textContent = '等待輸入 JSON...';
        this.currentJSON = null;
        this.updateStats();
        document.getElementById('output-chars').textContent = '字元數: 0';
        document.getElementById('validation-status').textContent = '';
        document.getElementById('validation-status').className = 'status-badge';
    }

    async copyToClipboard() {
        const text = this.jsonOutput.textContent;
        if (text === '等待輸入 JSON...') {
            this.showMessage('沒有可複製的內容', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('已複製到剪貼簿', 'success');
        } catch (error) {
            this.showMessage('複製失敗', 'error');
        }
    }

    downloadJSON() {
        const text = this.jsonOutput.textContent;
        if (text === '等待輸入 JSON...') {
            this.showMessage('沒有可下載的內容', 'error');
            return;
        }

        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formatted-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('下載成功', 'success');
    }

    showMessage(message, type = 'success') {
        const errorDisplay = document.getElementById('error-display');
        errorDisplay.textContent = message;
        errorDisplay.className = `error-display show ${type}`;

        setTimeout(() => {
            errorDisplay.classList.remove('show');
        }, 3000);
    }

    loadExamples() {
        this.examples = {
            simple: {
                name: "John Doe",
                age: 30,
                email: "john@example.com",
                active: true
            },
            array: {
                users: [
                    { id: 1, name: "Alice", role: "admin" },
                    { id: 2, name: "Bob", role: "user" },
                    { id: 3, name: "Charlie", role: "moderator" }
                ],
                total: 3
            },
            nested: {
                company: "Tech Corp",
                departments: {
                    engineering: {
                        manager: "Alice",
                        employees: ["Bob", "Charlie", "David"],
                        projects: {
                            project1: { name: "Website", status: "active" },
                            project2: { name: "Mobile App", status: "planning" }
                        }
                    },
                    sales: {
                        manager: "Eve",
                        employees: ["Frank", "Grace"],
                        revenue: 1000000
                    }
                }
            },
            api: {
                status: "success",
                code: 200,
                data: {
                    user: {
                        id: 12345,
                        username: "johndoe",
                        email: "john@example.com",
                        profile: {
                            firstName: "John",
                            lastName: "Doe",
                            avatar: "https://example.com/avatar.jpg"
                        },
                        settings: {
                            notifications: true,
                            theme: "dark",
                            language: "zh-TW"
                        }
                    },
                    posts: [
                        { id: 1, title: "First Post", likes: 42 },
                        { id: 2, title: "Second Post", likes: 156 }
                    ]
                },
                timestamp: new Date().toISOString()
            }
        };
    }

    loadExample(exampleName) {
        const example = this.examples[exampleName];
        if (example) {
            this.jsonInput.value = JSON.stringify(example, null, 2);
            this.updateStats();
            this.formatJSON();
        }
    }
}

// Initialize app
const jsonFormatter = new JSONFormatter();
