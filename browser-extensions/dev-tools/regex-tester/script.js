// Regex Tester Application
class RegexTester {
    constructor() {
        this.currentRegex = null;
        this.aiPatterns = this.loadAIPatterns();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadReference('basic');
    }

    setupEventListeners() {
        // AI Generator
        document.getElementById('ai-generate-btn').addEventListener('click', () => this.generateRegexWithAI());
        document.getElementById('ai-clear-btn').addEventListener('click', () => this.clearAIInput());
        document.getElementById('ai-use-result-btn')?.addEventListener('click', () => this.useAIResult());
        document.getElementById('ai-description').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.generateRegexWithAI();
            }
        });

        // Regex input
        document.getElementById('regex-input').addEventListener('input', () => this.testRegex());
        document.getElementById('flags-input').addEventListener('input', () => {
            this.syncFlags();
            this.testRegex();
        });

        // Flag checkboxes
        ['g', 'i', 'm', 's', 'u'].forEach(flag => {
            document.getElementById(`flag-${flag}`).addEventListener('change', () => {
                this.updateFlagsInput();
                this.testRegex();
            });
        });

        // Test input
        document.getElementById('test-input').addEventListener('input', () => this.testRegex());

        // Clear button
        document.getElementById('clear-test-btn').addEventListener('click', () => {
            document.getElementById('test-input').value = '';
            this.testRegex();
        });

        // Reference tabs
        document.querySelectorAll('.ref-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.ref-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.loadReference(e.target.dataset.tab);
            });
        });

        // Pattern cards
        document.querySelectorAll('.pattern-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const pattern = e.currentTarget.dataset.pattern;
                document.getElementById('regex-input').value = pattern;
                this.testRegex();
                this.loadTestCases(pattern);
            });
        });
    }

    syncFlags() {
        const flagsInput = document.getElementById('flags-input').value;
        ['g', 'i', 'm', 's', 'u'].forEach(flag => {
            document.getElementById(`flag-${flag}`).checked = flagsInput.includes(flag);
        });
    }

    updateFlagsInput() {
        let flags = '';
        ['g', 'i', 'm', 's', 'u'].forEach(flag => {
            if (document.getElementById(`flag-${flag}`).checked) {
                flags += flag;
            }
        });
        document.getElementById('flags-input').value = flags;
    }

    testRegex() {
        const pattern = document.getElementById('regex-input').value;
        const flags = document.getElementById('flags-input').value;
        const testString = document.getElementById('test-input').value;

        const errorDiv = document.getElementById('regex-error');
        const infoDiv = document.getElementById('regex-info');

        errorDiv.classList.remove('show');
        infoDiv.classList.remove('show');

        if (!pattern) {
            this.displayNoMatches();
            this.explainRegex('');
            return;
        }

        try {
            this.currentRegex = new RegExp(pattern, flags);
            const matches = this.findMatches(this.currentRegex, testString);

            this.displayMatches(matches);
            this.explainRegex(pattern, flags);

            if (matches.length > 0) {
                infoDiv.textContent = `✓ 正規表示式有效，找到 ${matches.length} 個符合`;
                infoDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = `✗ 錯誤: ${error.message}`;
            errorDiv.classList.add('show');
            this.displayNoMatches();
            this.currentRegex = null;
        }
    }

    findMatches(regex, text) {
        if (!text) return [];

        const matches = [];
        let match;

        if (regex.global) {
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1),
                    fullMatch: match
                });
            }
        } else {
            match = regex.exec(text);
            if (match) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1),
                    fullMatch: match
                });
            }
        }

        return matches;
    }

    displayMatches(matches) {
        const outputDiv = document.getElementById('matches-output');
        const countSpan = document.getElementById('match-count');

        if (matches.length === 0) {
            this.displayNoMatches();
            return;
        }

        countSpan.textContent = `符合: ${matches.length}`;

        outputDiv.innerHTML = matches.map((match, index) => `
            <div class="match-item">
                <div class="match-text">"${this.escapeHtml(match.text)}"</div>
                <div class="match-details">
                    符合 #${index + 1} | 位置: ${match.index}
                </div>
                ${match.groups.length > 0 ? `
                    <div class="match-groups">
                        <strong>擷取群組:</strong>
                        ${match.groups.map((group, i) => `
                            <div class="group-item">
                                <span class="group-index">群組 ${i + 1}:</span>
                                <span>"${this.escapeHtml(group || '')}"</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    displayNoMatches() {
        const outputDiv = document.getElementById('matches-output');
        const countSpan = document.getElementById('match-count');

        countSpan.textContent = '符合: 0';
        outputDiv.innerHTML = '<div class="no-matches">無符合結果</div>';
    }

    explainRegex(pattern, flags = '') {
        const explanationDiv = document.getElementById('regex-explanation');

        if (!pattern) {
            explanationDiv.innerHTML = '<p>輸入正規表示式後將顯示說明...</p>';
            return;
        }

        let explanation = '<div class="explanation-items">';

        // Explain flags
        if (flags) {
            explanation += '<h3>旗標說明:</h3><ul>';
            if (flags.includes('g')) explanation += '<li><code>g</code> - 全域匹配，找出所有符合項目</li>';
            if (flags.includes('i')) explanation += '<li><code>i</code> - 忽略大小寫</li>';
            if (flags.includes('m')) explanation += '<li><code>m</code> - 多行模式</li>';
            if (flags.includes('s')) explanation += '<li><code>s</code> - dotAll 模式，. 可匹配換行符號</li>';
            if (flags.includes('u')) explanation += '<li><code>u</code> - Unicode 模式</li>';
            explanation += '</ul>';
        }

        // Basic pattern explanation
        explanation += '<h3>模式組成:</h3><ul>';

        if (pattern.includes('^')) explanation += '<li><code>^</code> - 字串開頭</li>';
        if (pattern.includes('$')) explanation += '<li><code>$</code> - 字串結尾</li>';
        if (pattern.includes('\\d')) explanation += '<li><code>\\d</code> - 任何數字 (0-9)</li>';
        if (pattern.includes('\\w')) explanation += '<li><code>\\w</code> - 任何文字字元 (a-z, A-Z, 0-9, _)</li>';
        if (pattern.includes('\\s')) explanation += '<li><code>\\s</code> - 任何空白字元</li>';
        if (pattern.includes('+')) explanation += '<li><code>+</code> - 一次或多次</li>';
        if (pattern.includes('*')) explanation += '<li><code>*</code> - 零次或多次</li>';
        if (pattern.includes('?')) explanation += '<li><code>?</code> - 零次或一次</li>';
        if (pattern.includes('{')) explanation += '<li><code>{n,m}</code> - 出現 n 到 m 次</li>';
        if (pattern.includes('[')) explanation += '<li><code>[...]</code> - 字元集合</li>';
        if (pattern.includes('(')) explanation += '<li><code>(...)</code> - 擷取群組</li>';
        if (pattern.includes('|')) explanation += '<li><code>|</code> - 或 (OR)</li>';
        if (pattern.includes('.')) explanation += '<li><code>.</code> - 任何字元（除了換行）</li>';

        explanation += '</ul></div>';
        explanationDiv.innerHTML = explanation;
    }

    loadReference(category) {
        const content = document.getElementById('reference-content');

        const references = {
            basic: [
                ['.', '任何字元（除了換行）'],
                ['\\d', '數字 [0-9]'],
                ['\\D', '非數字'],
                ['\\w', '文字字元 [a-zA-Z0-9_]'],
                ['\\W', '非文字字元'],
                ['\\s', '空白字元（空格、tab、換行）'],
                ['\\S', '非空白字元']
            ],
            'char-classes': [
                ['[abc]', 'a 或 b 或 c'],
                ['[^abc]', '非 a、b、c'],
                ['[a-z]', 'a 到 z 的字元'],
                ['[A-Z]', 'A 到 Z 的字元'],
                ['[0-9]', '0 到 9 的數字'],
                ['[a-zA-Z]', '所有英文字母']
            ],
            quantifiers: [
                ['*', '0 次或多次'],
                ['+', '1 次或多次'],
                ['?', '0 次或 1 次'],
                ['{n}', '恰好 n 次'],
                ['{n,}', 'n 次或更多'],
                ['{n,m}', 'n 到 m 次']
            ],
            groups: [
                ['(abc)', '擷取群組'],
                ['(?:abc)', '非擷取群組'],
                ['(a|b)', 'a 或 b'],
                ['(?<name>abc)', '命名擷取群組'],
                ['\\1', '反向參照第一個群組']
            ],
            anchors: [
                ['^', '字串開頭'],
                ['$', '字串結尾'],
                ['\\b', '單字邊界'],
                ['\\B', '非單字邊界'],
                ['(?=abc)', '正向先行斷言'],
                ['(?!abc)', '負向先行斷言']
            ]
        };

        const items = references[category] || [];
        content.innerHTML = items.map(([pattern, desc]) => `
            <div class="ref-item">
                <code class="ref-pattern">${this.escapeHtml(pattern)}</code>
                <span class="ref-desc">${desc}</span>
            </div>
        `).join('');
    }

    loadTestCases(pattern) {
        const testCases = {
            '[a-zA-Z]+': [
                { text: 'Hello', match: true },
                { text: 'World123', match: false },
                { text: 'Test', match: true },
                { text: '123', match: false }
            ],
            '\\d+': [
                { text: '123', match: true },
                { text: 'abc', match: false },
                { text: '456789', match: true },
                { text: 'test123', match: false }
            ],
            '[0-9]{3}-[0-9]{4}': [
                { text: '123-4567', match: true },
                { text: '12-4567', match: false },
                { text: '123-456', match: false },
                { text: '987-6543', match: true }
            ],
            '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$': [
                { text: 'test@example.com', match: true },
                { text: 'user.name@domain.co.uk', match: true },
                { text: 'invalid@', match: false },
                { text: '@example.com', match: false }
            ]
        };

        const cases = testCases[pattern];
        const container = document.getElementById('test-cases');

        if (!cases) {
            container.innerHTML = '<p style="color: var(--text-secondary)">此模式無預設測試案例</p>';
            return;
        }

        container.innerHTML = cases.map(tc => `
            <div class="test-case">
                <span class="test-icon">${tc.match ? '✓' : '✗'}</span>
                <code class="test-text">${this.escapeHtml(tc.text)}</code>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // AI-Powered Regex Generation
    loadAIPatterns() {
        return {
            // Email patterns
            'email': {
                keywords: ['email', 'e-mail', '電子郵件', '信箱', 'mail'],
                regex: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
                explanation: '匹配標準電子郵件格式，支援字母、數字、點號和連字號',
                examples: ['test@example.com', 'user.name@domain.co.uk', 'john_doe@company.com.tw'],
                flags: ''
            },
            // Phone number patterns
            'phone-tw': {
                keywords: ['手機', '電話', 'phone', 'mobile', '行動電話', '09', '台灣手機'],
                regex: '^09\\d{8}$',
                explanation: '匹配台灣手機號碼格式 (09開頭，共10碼)',
                examples: ['0912345678', '0987654321', '0900123456'],
                flags: ''
            },
            'phone-general': {
                keywords: ['電話號碼', 'telephone', '市話'],
                regex: '^\\d{2,4}-\\d{6,8}$',
                explanation: '匹配一般電話號碼格式 (含區碼)',
                examples: ['02-12345678', '037-123456', '04-23456789'],
                flags: ''
            },
            // URL patterns
            'url': {
                keywords: ['url', '網址', 'link', 'website', 'http', 'https'],
                regex: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b',
                explanation: '匹配HTTP/HTTPS網址',
                examples: ['https://example.com', 'http://www.google.com', 'https://github.com/user/repo'],
                flags: ''
            },
            // Password patterns
            'password-strong': {
                keywords: ['密碼', 'password', '強密碼', 'strong password', '安全密碼'],
                regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
                explanation: '強密碼：至少8字元，包含大小寫字母、數字和特殊符號',
                examples: ['Passw0rd!', 'MyP@ssw0rd', 'Secure#123'],
                flags: ''
            },
            'password-medium': {
                keywords: ['一般密碼', '中等密碼'],
                regex: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$',
                explanation: '中等密碼：至少8字元，包含字母和數字',
                examples: ['Password123', 'mypass456', 'Test1234'],
                flags: ''
            },
            // Date patterns
            'date-ymd': {
                keywords: ['日期', 'date', 'yyyy-mm-dd', 'year-month-day'],
                regex: '^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
                explanation: '日期格式 YYYY-MM-DD',
                examples: ['2024-01-15', '2023-12-31', '2025-06-30'],
                flags: ''
            },
            'date-dmy': {
                keywords: ['dd/mm/yyyy', 'day-month-year'],
                regex: '^(0[1-9]|[12]\\d|3[01])\\/(0[1-9]|1[0-2])\\/(\\d{4})$',
                explanation: '日期格式 DD/MM/YYYY',
                examples: ['15/01/2024', '31/12/2023', '30/06/2025'],
                flags: ''
            },
            // ID patterns
            'id-card-tw': {
                keywords: ['身分證', '身份證', 'id card', '台灣身分證', 'taiwan id'],
                regex: '^[A-Z][12]\\d{8}$',
                explanation: '台灣身分證字號格式',
                examples: ['A123456789', 'B234567890', 'Z198765432'],
                flags: ''
            },
            // Color patterns
            'hex-color': {
                keywords: ['顏色', 'color', 'hex', '十六進位顏色', '#'],
                regex: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$',
                explanation: '十六進位顏色代碼 (含或不含#)',
                examples: ['#FFFFFF', 'FF0000', '#abc', 'def'],
                flags: 'i'
            },
            // Number patterns
            'integer': {
                keywords: ['整數', 'integer', 'number', '數字'],
                regex: '^-?\\d+$',
                explanation: '整數 (含正負號)',
                examples: ['123', '-456', '0', '9999'],
                flags: ''
            },
            'decimal': {
                keywords: ['小數', 'decimal', 'float', '浮點數'],
                regex: '^-?\\d+(\\.\\d+)?$',
                explanation: '小數 (含正負號)',
                examples: ['123.45', '-67.89', '0.1', '999'],
                flags: ''
            },
            // IP Address
            'ipv4': {
                keywords: ['ip', 'ip address', 'ipv4', 'ip位址'],
                regex: '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$',
                explanation: 'IPv4 位址',
                examples: ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'],
                flags: ''
            },
            // Credit Card
            'credit-card': {
                keywords: ['信用卡', 'credit card', '卡號'],
                regex: '^\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}$',
                explanation: '信用卡號碼 (16碼，可含空格或連字號)',
                examples: ['1234 5678 9012 3456', '1234-5678-9012-3456', '1234567890123456'],
                flags: ''
            },
            // Username
            'username': {
                keywords: ['使用者名稱', 'username', '帳號', 'account'],
                regex: '^[a-zA-Z0-9_]{3,16}$',
                explanation: '使用者名稱 (3-16字元，僅限英數字和底線)',
                examples: ['john_doe', 'user123', 'admin', 'test_user_01'],
                flags: ''
            },
            // Chinese characters
            'chinese': {
                keywords: ['中文', 'chinese', '漢字', '中文字'],
                regex: '[\\u4e00-\\u9fa5]+',
                explanation: '中文字元',
                examples: ['你好', '世界', '測試', '正則表達式'],
                flags: 'g'
            },
            // English letters
            'english': {
                keywords: ['英文', 'english', 'alphabet', '字母'],
                regex: '[a-zA-Z]+',
                explanation: '英文字母',
                examples: ['Hello', 'World', 'Test', 'ABC'],
                flags: 'g'
            },
            // Hashtag
            'hashtag': {
                keywords: ['標籤', 'hashtag', '#tag'],
                regex: '#[a-zA-Z0-9_]+',
                explanation: '社群媒體標籤 (#開頭)',
                examples: ['#javascript', '#coding', '#webdev', '#AI'],
                flags: 'g'
            }
        };
    }

    async generateRegexWithAI() {
        const description = document.getElementById('ai-description').value.trim();

        if (!description) {
            alert('請輸入要生成的正則表達式描述');
            return;
        }

        const loadingDiv = document.getElementById('ai-loading');
        const resultDiv = document.getElementById('ai-result');

        // Show loading
        loadingDiv.style.display = 'flex';
        resultDiv.style.display = 'none';

        try {
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Match user description with patterns
            const result = this.matchDescriptionToPattern(description);

            if (result) {
                this.displayAIResult(result);
            } else {
                this.displayAIFallback(description);
            }
        } catch (error) {
            alert('生成失敗: ' + error.message);
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    matchDescriptionToPattern(description) {
        const descLower = description.toLowerCase();

        // Find best matching pattern
        for (const [key, pattern] of Object.entries(this.aiPatterns)) {
            for (const keyword of pattern.keywords) {
                if (descLower.includes(keyword.toLowerCase())) {
                    return pattern;
                }
            }
        }

        return null;
    }

    displayAIResult(pattern) {
        const resultDiv = document.getElementById('ai-result');
        const regexElement = document.getElementById('ai-generated-regex');
        const explanationElement = document.getElementById('ai-generated-explanation');
        const examplesElement = document.getElementById('ai-generated-examples');

        regexElement.textContent = pattern.regex;
        explanationElement.textContent = pattern.explanation;

        examplesElement.innerHTML = pattern.examples.map(example => `
            <div class="example-item">
                <code>${this.escapeHtml(example)}</code>
            </div>
        `).join('');

        resultDiv.style.display = 'block';
        this.currentAIPattern = pattern;
    }

    displayAIFallback(description) {
        const resultDiv = document.getElementById('ai-result');
        const regexElement = document.getElementById('ai-generated-regex');
        const explanationElement = document.getElementById('ai-generated-explanation');
        const examplesElement = document.getElementById('ai-generated-examples');

        // Generate a basic fallback based on common patterns
        let fallbackRegex = '.*';
        let fallbackExplanation = '抱歉，無法從描述中識別出匹配的模式。以下是一些建議：\n\n';

        if (description.includes('數字') || description.includes('number')) {
            fallbackRegex = '\\d+';
            fallbackExplanation = '匹配一個或多個數字';
        } else if (description.includes('字母') || description.includes('letter')) {
            fallbackRegex = '[a-zA-Z]+';
            fallbackExplanation = '匹配一個或多個英文字母';
        } else if (description.includes('空格') || description.includes('space')) {
            fallbackRegex = '\\s+';
            fallbackExplanation = '匹配一個或多個空白字元';
        } else {
            fallbackExplanation += '• 嘗試使用更具體的關鍵詞，如："email"、"電話"、"日期" 等\n';
            fallbackExplanation += '• 或者從「常用模式」中選擇相似的模式作為起點\n';
            fallbackExplanation += '• 您也可以參考下方的「快速參考」來手動構建正則表達式';
        }

        regexElement.textContent = fallbackRegex;
        explanationElement.textContent = fallbackExplanation;
        examplesElement.innerHTML = '<p style="color: var(--text-secondary)">請參考上方建議，或從常用模式中選擇</p>';

        resultDiv.style.display = 'block';
        this.currentAIPattern = {
            regex: fallbackRegex,
            explanation: fallbackExplanation,
            examples: [],
            flags: ''
        };
    }

    useAIResult() {
        if (!this.currentAIPattern) return;

        document.getElementById('regex-input').value = this.currentAIPattern.regex;
        document.getElementById('flags-input').value = this.currentAIPattern.flags || '';

        // Update flag checkboxes
        ['g', 'i', 'm', 's', 'u'].forEach(flag => {
            const checkbox = document.getElementById(`flag-${flag}`);
            checkbox.checked = this.currentAIPattern.flags.includes(flag);
        });

        // Update test input with examples
        if (this.currentAIPattern.examples && this.currentAIPattern.examples.length > 0) {
            document.getElementById('test-input').value = this.currentAIPattern.examples.join('\n');
        }

        // Test the regex
        this.testRegex();

        // Scroll to regex section
        document.querySelector('.regex-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Show success message
        setTimeout(() => {
            alert('✅ 已將 AI 生成的正則表達式填入，並自動載入測試範例！');
        }, 300);
    }

    clearAIInput() {
        document.getElementById('ai-description').value = '';
        document.getElementById('ai-result').style.display = 'none';
        this.currentAIPattern = null;
    }
}

// Initialize app
const regexTester = new RegexTester();
