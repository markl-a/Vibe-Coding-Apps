// Markdown Previewer Application
class MarkdownPreviewer {
    constructor() {
        this.viewMode = 'split'; // split, edit, preview
        this.theme = 'dark';
        this.init();
    }

    init() {
        this.setupMarked();
        this.setupEventListeners();
        this.loadSavedContent();
        this.updatePreview();
    }

    setupMarked() {
        // Configure marked.js
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            pedantic: false,
            smartLists: true,
            smartypants: true,
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.error('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }

    setupEventListeners() {
        const input = document.getElementById('markdown-input');

        // Real-time preview with debounce
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.updatePreview();
                this.updateWordCount();
                this.saveContent();
            }, 300);
        });

        // View mode toggle
        document.getElementById('toggle-mode-btn').addEventListener('click', () => {
            this.cycleViewMode();
        });

        // Theme toggle
        document.getElementById('toggle-theme-btn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Reference toggle
        document.getElementById('toggle-reference-btn').addEventListener('click', () => {
            this.toggleReference();
        });

        // Tab key for indentation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = input.value.substring(0, start) + '    ' + input.value.substring(end);
                input.selectionStart = input.selectionEnd = start + 4;
                this.updatePreview();
            }
        });

        // Initial word count
        this.updateWordCount();
    }

    updatePreview() {
        const input = document.getElementById('markdown-input').value;
        const preview = document.getElementById('markdown-preview');

        if (!input.trim()) {
            preview.innerHTML = `
                <div class="empty-state">
                    <p>📝 在左側編輯器輸入 Markdown，這裡會即時顯示預覽</p>
                    <p>或點擊「範例」按鈕查看 Markdown 語法示範</p>
                </div>
            `;
            return;
        }

        try {
            const html = marked.parse(input);
            preview.innerHTML = html;

            // Re-highlight code blocks
            preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } catch (error) {
            preview.innerHTML = `
                <div class="error-message">
                    <h3>❌ 解析錯誤</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    updateWordCount() {
        const input = document.getElementById('markdown-input').value;
        const charCount = input.length;
        const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
        const lineCount = input.split('\n').length;

        document.getElementById('word-count').textContent =
            `${charCount} 字元 | ${wordCount} 字 | ${lineCount} 行`;
    }

    insertMarkdown(before, after) {
        const textarea = document.getElementById('markdown-input');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacement = before + selectedText + after;

        textarea.value =
            textarea.value.substring(0, start) +
            replacement +
            textarea.value.substring(end);

        // Set cursor position
        const newPos = start + before.length + selectedText.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;

        textarea.focus();
        this.updatePreview();
        this.updateWordCount();
    }

    insertTable() {
        const table = `| 標題1 | 標題2 | 標題3 |
|-------|-------|-------|
| 內容1 | 內容2 | 內容3 |
| 內容4 | 內容5 | 內容6 |

`;
        const textarea = document.getElementById('markdown-input');
        const start = textarea.selectionStart;
        textarea.value =
            textarea.value.substring(0, start) +
            table +
            textarea.value.substring(start);

        textarea.focus();
        this.updatePreview();
        this.updateWordCount();
    }

    clearEditor() {
        if (confirm('確定要清除所有內容嗎？')) {
            document.getElementById('markdown-input').value = '';
            this.updatePreview();
            this.updateWordCount();
            this.saveContent();
        }
    }

    loadExample() {
        const example = `# Markdown 語法示範

## 文字樣式

這是 **粗體文字**，這是 *斜體文字*，這是 ***粗斜體***。

這是 ~~刪除線~~文字，這是 \`行內程式碼\`。

## 標題層級

# H1 標題
## H2 標題
### H3 標題
#### H4 標題
##### H5 標題
###### H6 標題

## 列表

### 無序列表
- 項目 1
- 項目 2
  - 子項目 2.1
  - 子項目 2.2
- 項目 3

### 有序列表
1. 第一項
2. 第二項
3. 第三項

### 待辦事項
- [x] 已完成的任務
- [ ] 待完成的任務
- [ ] 另一個待辦事項

## 連結和圖片

[這是一個連結](https://www.example.com)

![圖片說明文字](https://via.placeholder.com/600x200?text=Markdown+Image)

## 引用

> 這是一段引用文字。
> 可以跨多行。
>
> — 作者名稱

## 程式碼區塊

行內程式碼：\`const x = 10;\`

程式碼區塊：

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

## 表格

| 功能 | 描述 | 狀態 |
|------|------|------|
| 即時預覽 | 輸入即時顯示 | ✅ 完成 |
| 語法高亮 | 程式碼美化 | ✅ 完成 |
| 導出功能 | 下載檔案 | ✅ 完成 |
| AI 輔助 | 智能建議 | 🚧 開發中 |

## 水平分隔線

---

## 更多功能

### 任務清單
- [x] 支援 GitHub Flavored Markdown
- [x] 語法高亮
- [x] 表格支援
- [ ] 數學公式 (LaTeX)
- [ ] 圖表繪製 (Mermaid)

### 注意事項

> ⚠️ **注意**：某些 Markdown 擴展可能需要額外的外掛程式支援。

> 💡 **提示**：使用工具列按鈕可以快速插入 Markdown 語法。

---

**最後更新**: ${new Date().toLocaleDateString('zh-TW')}
`;

        document.getElementById('markdown-input').value = example;
        this.updatePreview();
        this.updateWordCount();
        this.showToast('已載入範例內容');
    }

    copyHTML() {
        const preview = document.getElementById('markdown-preview');
        const html = preview.innerHTML;

        navigator.clipboard.writeText(html).then(() => {
            this.showToast('✅ HTML 已複製到剪貼簿');
        }).catch(() => {
            this.showToast('❌ 複製失敗', 'error');
        });
    }

    exportMarkdown() {
        const content = document.getElementById('markdown-input').value;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        this.downloadFile(blob, `markdown-${Date.now()}.md`);
        this.showToast('✅ Markdown 檔案已下載');
    }

    exportHTML() {
        const preview = document.getElementById('markdown-preview');
        const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #e4e4e7;
            background: #1e1e1e;
        }
        img { max-width: 100%; height: auto; }
        code {
            background: #2d2d2d;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        pre {
            background: #2d2d2d;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #3f3f46;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #2d2d2d;
            font-weight: 600;
        }
        blockquote {
            border-left: 4px solid #8b5cf6;
            padding-left: 20px;
            margin-left: 0;
            color: #a1a1aa;
        }
        a {
            color: #8b5cf6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        this.downloadFile(blob, `markdown-${Date.now()}.html`);
        this.showToast('✅ HTML 檔案已下載');
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    cycleViewMode() {
        const modes = ['split', 'edit', 'preview'];
        const currentIndex = modes.indexOf(this.viewMode);
        this.viewMode = modes[(currentIndex + 1) % modes.length];

        const mainContent = document.getElementById('main-content');
        const editorPanel = document.getElementById('editor-panel');
        const previewPanel = document.getElementById('preview-panel');
        const modeIcon = document.getElementById('mode-icon');

        mainContent.classList.remove('split-mode', 'edit-mode', 'preview-mode');

        switch (this.viewMode) {
            case 'split':
                mainContent.classList.add('split-mode');
                editorPanel.style.display = 'flex';
                previewPanel.style.display = 'flex';
                modeIcon.textContent = '⊞';
                break;
            case 'edit':
                mainContent.classList.add('edit-mode');
                editorPanel.style.display = 'flex';
                previewPanel.style.display = 'none';
                modeIcon.textContent = '✏️';
                break;
            case 'preview':
                mainContent.classList.add('preview-mode');
                editorPanel.style.display = 'none';
                previewPanel.style.display = 'flex';
                modeIcon.textContent = '👁️';
                break;
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme');

        const btn = document.getElementById('toggle-theme-btn');
        btn.textContent = this.theme === 'dark' ? '🌙' : '☀️';

        // Update highlight.js theme
        const highlightLink = document.querySelector('link[href*="highlight.js"]');
        if (highlightLink) {
            highlightLink.href = this.theme === 'dark'
                ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        }

        this.updatePreview();
    }

    toggleReference() {
        const content = document.getElementById('reference-content');
        const btn = document.getElementById('toggle-reference-btn');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.textContent = '▼';
        } else {
            content.style.display = 'none';
            btn.textContent = '▶';
        }
    }

    saveContent() {
        const content = document.getElementById('markdown-input').value;
        localStorage.setItem('markdown-content', content);
    }

    loadSavedContent() {
        const saved = localStorage.getItem('markdown-content');
        if (saved) {
            document.getElementById('markdown-input').value = saved;
            this.updateWordCount();
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

// Initialize app
const mdPreviewer = new MarkdownPreviewer();
