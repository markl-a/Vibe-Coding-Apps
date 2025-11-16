// Regex Tester Application
class RegexTester {
    constructor() {
        this.currentRegex = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadReference('basic');
    }

    setupEventListeners() {
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
}

// Initialize app
const regexTester = new RegexTester();
