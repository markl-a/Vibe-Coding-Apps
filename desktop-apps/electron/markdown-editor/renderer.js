// ===== 全域變數 =====
let currentFilePath = null;
let isDirty = false;
let autoSaveTimer = null;
let isResizing = false;

// ===== DOM 元素 =====
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const statusMessage = document.getElementById('statusMessage');
const currentFileEl = document.getElementById('currentFile');
const recentFilesEl = document.getElementById('recentFiles');
const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('resizer');

// ===== Marked.js 設定 =====
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  }
});

// ===== 初始化 =====
async function init() {
  // 載入設定
  const theme = await window.electronAPI.getConfig('theme', 'light');
  applyTheme(theme);

  const autoSave = await window.electronAPI.getConfig('autoSave', true);
  if (autoSave) {
    startAutoSave();
  }

  // 載入最近檔案
  loadRecentFiles();

  // 初始預覽
  updatePreview();
  updateStats();

  // 設定事件監聽器
  setupEventListeners();

  setStatus('就緒');
}

// ===== 事件監聽器設定 =====
function setupEventListeners() {
  // 編輯器輸入
  editor.addEventListener('input', () => {
    isDirty = true;
    updatePreview();
    updateStats();
  });

  // 工具列按鈕
  document.getElementById('newFileBtn').addEventListener('click', newFile);
  document.getElementById('openFileBtn').addEventListener('click', openFile);
  document.getElementById('saveFileBtn').addEventListener('click', saveFile);
  document.getElementById('boldBtn').addEventListener('click', () => formatText('**', '**'));
  document.getElementById('italicBtn').addEventListener('click', () => formatText('*', '*'));
  document.getElementById('linkBtn').addEventListener('click', insertLink);
  document.getElementById('imageBtn').addEventListener('click', insertImage);
  document.getElementById('codeBtn').addEventListener('click', insertCodeBlock);
  document.getElementById('exportHtmlBtn').addEventListener('click', exportHtml);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
  document.getElementById('copyHtmlBtn').addEventListener('click', copyHtml);
  document.getElementById('toggleSidebarBtn').addEventListener('click', toggleSidebar);

  // 選單事件
  window.electronAPI.onMenuNewFile(newFile);
  window.electronAPI.onMenuOpenFile(openFile);
  window.electronAPI.onMenuSaveFile(saveFile);
  window.electronAPI.onMenuSaveFileAs(saveFileAs);
  window.electronAPI.onMenuExportHtml(exportHtml);
  window.electronAPI.onMenuExportPdf(exportPdf);
  window.electronAPI.onMenuToggleTheme(toggleTheme);
  window.electronAPI.onMenuFormatBold(() => formatText('**', '**'));
  window.electronAPI.onMenuFormatItalic(() => formatText('*', '*'));
  window.electronAPI.onMenuFormatStrikethrough(() => formatText('~~', '~~'));
  window.electronAPI.onMenuFormatH1(() => formatHeading('#'));
  window.electronAPI.onMenuFormatH2(() => formatHeading('##'));
  window.electronAPI.onMenuFormatH3(() => formatHeading('###'));
  window.electronAPI.onMenuFormatLink(insertLink);
  window.electronAPI.onMenuFormatImage(insertImage);
  window.electronAPI.onMenuFormatCode(insertCodeBlock);

  // 拖放上傳圖片
  editor.addEventListener('drop', handleFileDrop);
  editor.addEventListener('dragover', (e) => e.preventDefault());

  // 分隔線調整大小
  resizer.addEventListener('mousedown', initResize);

  // 快捷鍵
  editor.addEventListener('keydown', handleKeydown);
}

// ===== 檔案操作 =====
async function newFile() {
  if (isDirty) {
    const confirmed = confirm('目前檔案有未儲存的變更，是否要繼續？');
    if (!confirmed) return;
  }

  currentFilePath = null;
  editor.value = '';
  isDirty = false;
  updateCurrentFile('未命名文件');
  updatePreview();
  updateStats();
  setStatus('新檔案已建立');
}

async function openFile() {
  const result = await window.electronAPI.openFileDialog();

  if (result) {
    currentFilePath = result.path;
    editor.value = result.content;
    isDirty = false;
    updateCurrentFile(getFileName(result.path));
    updatePreview();
    updateStats();
    loadRecentFiles();
    setStatus(`已開啟: ${getFileName(result.path)}`);
  }
}

async function saveFile() {
  if (!currentFilePath) {
    return saveFileAs();
  }

  const result = await window.electronAPI.saveFile(currentFilePath, editor.value);

  if (result.success) {
    isDirty = false;
    setStatus(`已儲存: ${getFileName(currentFilePath)}`);
    loadRecentFiles();
    return true;
  } else {
    setStatus(`儲存失敗: ${result.error}`, 'error');
    return false;
  }
}

async function saveFileAs() {
  const filePath = await window.electronAPI.saveFileDialog(currentFilePath);

  if (filePath) {
    currentFilePath = filePath;
    updateCurrentFile(getFileName(filePath));
    return saveFile();
  }
  return false;
}

// ===== 匯出功能 =====
async function exportHtml() {
  const html = generateFullHtml();
  const result = await window.electronAPI.exportHtml(html);

  if (result.success) {
    setStatus(`已匯出 HTML: ${getFileName(result.path)}`);
  } else if (result.error) {
    setStatus(`匯出失敗: ${result.error}`, 'error');
  }
}

async function exportPdf() {
  const result = await window.electronAPI.exportPdf();

  if (result.success) {
    setStatus(`已匯出 PDF: ${getFileName(result.path)}`);
  } else if (result.error) {
    setStatus(`匯出失敗: ${result.error}`, 'error');
  }
}

function generateFullHtml() {
  const content = preview.innerHTML;
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getFileName(currentFilePath) || '未命名文件'}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.7;
    }
    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    pre { background-color: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background-color: transparent; padding: 0; }
    blockquote { border-left: 4px solid #0066cc; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

async function copyHtml() {
  const html = preview.innerHTML;
  navigator.clipboard.writeText(html);
  setStatus('HTML 已複製到剪貼簿');
}

// ===== 格式化功能 =====
function formatText(prefix, suffix) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selectedText = editor.value.substring(start, end);
  const beforeText = editor.value.substring(0, start);
  const afterText = editor.value.substring(end);

  if (selectedText) {
    editor.value = beforeText + prefix + selectedText + suffix + afterText;
    editor.selectionStart = start + prefix.length;
    editor.selectionEnd = end + prefix.length;
  } else {
    const placeholder = '文字';
    editor.value = beforeText + prefix + placeholder + suffix + afterText;
    editor.selectionStart = start + prefix.length;
    editor.selectionEnd = start + prefix.length + placeholder.length;
  }

  editor.focus();
  isDirty = true;
  updatePreview();
}

function formatHeading(prefix) {
  const start = editor.selectionStart;
  const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = editor.value.indexOf('\n', start);
  const end = lineEnd === -1 ? editor.value.length : lineEnd;

  const line = editor.value.substring(lineStart, end);
  const beforeText = editor.value.substring(0, lineStart);
  const afterText = editor.value.substring(end);

  // 移除現有的標題符號
  const cleanLine = line.replace(/^#+\s*/, '');

  editor.value = beforeText + prefix + ' ' + cleanLine + afterText;
  editor.selectionStart = lineStart + prefix.length + 1;
  editor.selectionEnd = lineStart + prefix.length + 1 + cleanLine.length;
  editor.focus();
  isDirty = true;
  updatePreview();
}

function insertLink() {
  const url = prompt('輸入連結網址:', 'https://');
  if (!url) return;

  const text = prompt('輸入連結文字:', '連結');
  if (!text) return;

  const start = editor.selectionStart;
  const beforeText = editor.value.substring(0, start);
  const afterText = editor.value.substring(editor.selectionEnd);

  editor.value = beforeText + `[${text}](${url})` + afterText;
  editor.selectionStart = start + text.length + url.length + 4;
  editor.focus();
  isDirty = true;
  updatePreview();
}

function insertImage() {
  const url = prompt('輸入圖片網址:', 'https://');
  if (!url) return;

  const alt = prompt('輸入圖片描述:', '圖片');
  if (!alt) return;

  const start = editor.selectionStart;
  const beforeText = editor.value.substring(0, start);
  const afterText = editor.value.substring(editor.selectionEnd);

  editor.value = beforeText + `![${alt}](${url})` + afterText;
  editor.selectionStart = start + alt.length + url.length + 5;
  editor.focus();
  isDirty = true;
  updatePreview();
}

function insertCodeBlock() {
  const lang = prompt('程式語言 (選填):', 'javascript');
  const start = editor.selectionStart;
  const beforeText = editor.value.substring(0, start);
  const afterText = editor.value.substring(editor.selectionEnd);

  const codeBlock = `\n\`\`\`${lang || ''}\n// 在此輸入程式碼\n\`\`\`\n`;
  editor.value = beforeText + codeBlock + afterText;
  editor.selectionStart = start + 4 + (lang ? lang.length : 0) + 1;
  editor.focus();
  isDirty = true;
  updatePreview();
}

// ===== 預覽更新 =====
function updatePreview() {
  const markdown = editor.value;
  let html = marked.parse(markdown);

  // 處理 KaTeX 數學公式
  html = renderMath(html);

  preview.innerHTML = html;
}

function renderMath(html) {
  // 簡單的數學公式渲染（可以進一步完善）
  return html;
}

// ===== 統計更新 =====
function updateStats() {
  const text = editor.value;

  // 字元數
  charCount.textContent = `${text.length} 字元`;

  // 字數（中英文混合）
  const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+/g);
  wordCount.textContent = `${words ? words.length : 0} 字`;

  // 行數
  const lines = text.split('\n').length;
  lineCount.textContent = `${lines} 行`;
}

// ===== 主題切換 =====
async function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  await window.electronAPI.setConfig('theme', newTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggleBtn').textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    document.getElementById('themeToggleBtn').textContent = '🌙';
  }
}

// ===== 最近檔案 =====
async function loadRecentFiles() {
  const files = await window.electronAPI.getRecentFiles();

  if (files.length === 0) {
    recentFilesEl.innerHTML = '<div class="empty-state">尚無最近開啟的檔案</div>';
    return;
  }

  recentFilesEl.innerHTML = files.map(file =>
    `<div class="recent-file-item" data-path="${file}" title="${file}">
      ${getFileName(file)}
    </div>`
  ).join('');

  // 添加點擊事件
  document.querySelectorAll('.recent-file-item').forEach(item => {
    item.addEventListener('click', async () => {
      const path = item.dataset.path;
      const result = await window.electronAPI.readFile(path);

      if (result.success) {
        currentFilePath = path;
        editor.value = result.content;
        isDirty = false;
        updateCurrentFile(getFileName(path));
        updatePreview();
        updateStats();
        setStatus(`已開啟: ${getFileName(path)}`);
      } else {
        setStatus(`開啟失敗: ${result.error}`, 'error');
      }
    });
  });
}

// ===== 輔助函數 =====
function updateCurrentFile(filename) {
  currentFileEl.textContent = filename;
  document.title = `${filename} - Markdown Editor`;
}

function getFileName(path) {
  if (!path) return '未命名文件';
  return path.split(/[\\/]/).pop();
}

function setStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.style.color = type === 'error' ? '#dc3545' : 'var(--text-secondary)';

  // 3秒後恢復預設狀態
  setTimeout(() => {
    statusMessage.textContent = '就緒';
    statusMessage.style.color = 'var(--text-secondary)';
  }, 3000);
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  const btn = document.getElementById('toggleSidebarBtn');
  btn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
}

// ===== 自動儲存 =====
function startAutoSave() {
  autoSaveTimer = setInterval(async () => {
    if (isDirty && currentFilePath) {
      await saveFile();
    }
  }, 30000); // 每30秒自動儲存
}

// ===== 拖放處理 =====
function handleFileDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;

  if (files.length > 0) {
    const file = files[0];

    if (file.type.startsWith('image/')) {
      // 處理圖片（這裡簡化處理，實際應該上傳或複製圖片）
      const reader = new FileReader();
      reader.onload = (event) => {
        const start = editor.selectionStart;
        const beforeText = editor.value.substring(0, start);
        const afterText = editor.value.substring(editor.selectionEnd);

        editor.value = beforeText + `![${file.name}](${event.target.result})` + afterText;
        isDirty = true;
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  }
}

// ===== 調整大小 =====
function initResize(e) {
  isResizing = true;
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}

function resize(e) {
  if (!isResizing) return;

  const container = document.querySelector('.editor-container');
  const containerRect = container.getBoundingClientRect();
  const editorPanel = document.querySelector('.editor-panel');

  let newWidth = e.clientX - containerRect.left;
  newWidth = Math.max(200, Math.min(newWidth, containerRect.width - 200));

  editorPanel.style.flex = `0 0 ${newWidth}px`;
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
}

// ===== 快捷鍵處理 =====
function handleKeydown(e) {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === 's') {
    e.preventDefault();
    saveFile();
  } else if (ctrl && e.key === 'n') {
    e.preventDefault();
    newFile();
  } else if (ctrl && e.key === 'o') {
    e.preventDefault();
    openFile();
  }
}

// ===== 啟動應用 =====
init();
