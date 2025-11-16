// 應用狀態
let notes = [];
let currentNoteId = null;
let currentFilter = 'all';
let currentView = 'split';
let searchQuery = '';
let autoSaveTimer = null;

// DOM 元素
const emptyState = document.getElementById('emptyState');
const editorContainer = document.getElementById('editorContainer');
const notesList = document.getElementById('notesList');
const newNoteBtn = document.getElementById('newNoteBtn');
const noteTitle = document.getElementById('noteTitle');
const markdownEditor = document.getElementById('markdownEditor');
const markdownPreview = document.getElementById('markdownPreview');
const searchInput = document.getElementById('searchInput');
const favoriteBtn = document.getElementById('favoriteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const tagInput = document.getElementById('tagInput');
const noteTags = document.getElementById('noteTags');
const tagsList = document.getElementById('tagsList');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// 統計元素
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const lastSaved = document.getElementById('lastSaved');

// 初始化
function init() {
    // 配置 marked.js
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });

    loadNotes();
    renderNotesList();
    updateStats();
    attachEventListeners();

    if (notes.length === 0) {
        showEmptyState();
    }
}

// 載入筆記
function loadNotes() {
    const savedNotes = localStorage.getItem('markdownNotes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

// 儲存筆記
function saveNotes() {
    localStorage.setItem('markdownNotes', JSON.stringify(notes));
    updateLastSaved();
}

// 綁定事件監聽器
function attachEventListeners() {
    // 新增筆記
    newNoteBtn.addEventListener('click', createNewNote);

    // 標題編輯
    noteTitle.addEventListener('input', handleTitleChange);

    // 內容編輯
    markdownEditor.addEventListener('input', handleContentChange);

    // 搜尋
    searchInput.addEventListener('input', handleSearch);

    // 最愛
    favoriteBtn.addEventListener('click', toggleFavorite);

    // 刪除
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);

    // 標籤輸入
    tagInput.addEventListener('keydown', handleTagInput);

    // 視圖切換
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // 篩選
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => switchFilter(btn.dataset.filter));
    });

    // 工具列按鈕
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => handleToolbarAction(btn.dataset.action));
    });

    // 匯出/匯入
    exportBtn.addEventListener('click', exportNotes);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importNotes);

    // 鍵盤快捷鍵
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 創建新筆記
function createNewNote() {
    const note = {
        id: Date.now().toString(),
        title: '未命名筆記',
        content: '',
        tags: [],
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    notes.unshift(note);
    saveNotes();
    openNote(note.id);
    renderNotesList();
    updateStats();

    noteTitle.focus();
    noteTitle.select();
}

// 打開筆記
function openNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    currentNoteId = noteId;

    // 隱藏空狀態，顯示編輯器
    emptyState.style.display = 'none';
    editorContainer.style.display = 'flex';

    // 設定內容
    noteTitle.value = note.title;
    markdownEditor.value = note.content;
    updatePreview();
    updateEditorStats();

    // 更新最愛按鈕
    favoriteBtn.classList.toggle('active', note.favorite);

    // 渲染標籤
    renderNoteTags();

    // 更新列表選中狀態
    updateNotesListSelection();
}

// 處理標題變更
function handleTitleChange() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.title = noteTitle.value || '未命名筆記';
        note.updatedAt = new Date().toISOString();
        scheduleAutoSave();
        renderNotesList();
    }
}

// 處理內容變更
function handleContentChange() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.content = markdownEditor.value;
        note.updatedAt = new Date().toISOString();
        updatePreview();
        updateEditorStats();
        scheduleAutoSave();
    }
}

// 更新預覽
function updatePreview() {
    const content = markdownEditor.value;
    markdownPreview.innerHTML = marked.parse(content);

    // 高亮程式碼
    markdownPreview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

// 更新編輯器統計
function updateEditorStats() {
    const content = markdownEditor.value;
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;

    charCount.textContent = `${chars} 字元`;
    wordCount.textContent = `${words} 字`;
    lineCount.textContent = `${lines} 行`;
}

// 自動儲存
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveNotes();
    }, 1000);
}

// 更新最後儲存時間
function updateLastSaved() {
    const now = new Date();
    lastSaved.textContent = `已儲存於 ${now.toLocaleTimeString('zh-TW')}`;
}

// 切換視圖
function switchView(view) {
    currentView = view;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    const wrapper = document.querySelector('.editor-wrapper');
    wrapper.className = 'editor-wrapper ' + view;
}

// 渲染筆記列表
function renderNotesList() {
    const filteredNotes = getFilteredNotes();

    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">沒有筆記</div>';
        return;
    }

    notesList.innerHTML = filteredNotes.map(note => {
        const preview = note.content.substring(0, 100).replace(/[#*`]/g, '');
        return `
            <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" onclick="openNote('${note.id}')">
                <div class="note-item-title">
                    ${note.favorite ? '⭐' : ''}
                    ${escapeHTML(note.title)}
                </div>
                ${preview ? `<div class="note-item-preview">${escapeHTML(preview)}</div>` : ''}
                <div class="note-item-date">${formatDate(note.updatedAt)}</div>
            </div>
        `;
    }).join('');

    renderTagsList();
}

// 渲染標籤列表
function renderTagsList() {
    const allTags = {};
    notes.forEach(note => {
        note.tags.forEach(tag => {
            allTags[tag] = (allTags[tag] || 0) + 1;
        });
    });

    const tagsHTML = Object.entries(allTags)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => `
            <div class="tag-item" onclick="filterByTag('${tag}')">
                ${escapeHTML(tag)} (${count})
            </div>
        `).join('');

    tagsList.innerHTML = tagsHTML || '<div style="color: var(--text-secondary); font-size: 0.85rem;">沒有標籤</div>';
}

// 渲染筆記標籤
function renderNoteTags() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    noteTags.innerHTML = note.tags.map(tag => `
        <div class="note-tag">
            ${escapeHTML(tag)}
            <span class="remove" onclick="removeTag('${tag}')">×</span>
        </div>
    `).join('');
}

// 處理標籤輸入
function handleTagInput(e) {
    if (e.key === 'Enter' && tagInput.value.trim()) {
        e.preventDefault();
        addTag(tagInput.value.trim());
        tagInput.value = '';
    }
}

// 添加標籤
function addTag(tag) {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note && !note.tags.includes(tag)) {
        note.tags.push(tag);
        note.updatedAt = new Date().toISOString();
        saveNotes();
        renderNoteTags();
        renderTagsList();
    }
}

// 移除標籤
function removeTag(tag) {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.tags = note.tags.filter(t => t !== tag);
        note.updatedAt = new Date().toISOString();
        saveNotes();
        renderNoteTags();
        renderTagsList();
    }
}

// 切換最愛
function toggleFavorite() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.favorite = !note.favorite;
        note.updatedAt = new Date().toISOString();
        favoriteBtn.classList.toggle('active', note.favorite);
        saveNotes();
        renderNotesList();
        updateStats();
    }
}

// 刪除當前筆記
function deleteCurrentNote() {
    if (!currentNoteId) return;

    if (confirm('確定要刪除這個筆記嗎？')) {
        notes = notes.filter(n => n.id !== currentNoteId);
        saveNotes();

        if (notes.length > 0) {
            openNote(notes[0].id);
        } else {
            showEmptyState();
        }

        renderNotesList();
        updateStats();
    }
}

// 顯示空狀態
function showEmptyState() {
    emptyState.style.display = 'flex';
    editorContainer.style.display = 'none';
    currentNoteId = null;
}

// 獲取篩選後的筆記
function getFilteredNotes() {
    let filtered = [...notes];

    // 根據篩選條件
    if (currentFilter === 'favorites') {
        filtered = filtered.filter(n => n.favorite);
    } else if (currentFilter === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(n => new Date(n.updatedAt) > oneWeekAgo);
    }

    // 搜尋
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(n =>
            n.title.toLowerCase().includes(query) ||
            n.content.toLowerCase().includes(query) ||
            n.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // 按更新時間排序
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return filtered;
}

// 處理搜尋
function handleSearch(e) {
    searchQuery = e.target.value;
    renderNotesList();
}

// 切換篩選
function switchFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderNotesList();
}

// 根據標籤篩選
function filterByTag(tag) {
    searchQuery = tag;
    searchInput.value = tag;
    renderNotesList();
}

// 更新列表選中狀態
function updateNotesListSelection() {
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.onclick.toString().includes(currentNoteId));
    });
}

// 處理工具列操作
function handleToolbarAction(action) {
    const textarea = markdownEditor;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (action) {
        case 'bold':
            replacement = `**${selectedText || '粗體文字'}**`;
            break;
        case 'italic':
            replacement = `*${selectedText || '斜體文字'}*`;
            break;
        case 'strikethrough':
            replacement = `~~${selectedText || '刪除線文字'}~~`;
            break;
        case 'heading':
            replacement = `\n## ${selectedText || '標題'}\n`;
            break;
        case 'quote':
            replacement = `\n> ${selectedText || '引用文字'}\n`;
            break;
        case 'code':
            replacement = selectedText.includes('\n')
                ? `\`\`\`\n${selectedText || '程式碼'}\n\`\`\``
                : `\`${selectedText || '程式碼'}\``;
            break;
        case 'link':
            replacement = `[${selectedText || '連結文字'}](https://)`;
            break;
        case 'image':
            replacement = `![${selectedText || '圖片描述'}](https://)`;
            break;
        case 'ul':
            replacement = `\n- ${selectedText || '列表項目'}\n`;
            break;
        case 'ol':
            replacement = `\n1. ${selectedText || '列表項目'}\n`;
            break;
        case 'task':
            replacement = `\n- [ ] ${selectedText || '待辦事項'}\n`;
            break;
        case 'table':
            replacement = `\n| 標題 1 | 標題 2 |\n| ------ | ------ |\n| 內容 1 | 內容 2 |\n`;
            break;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    handleContentChange();
}

// 更新統計
function updateStats() {
    const total = notes.length;
    const favorites = notes.filter(n => n.favorite).length;
    const recent = notes.filter(n => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(n.updatedAt) > oneWeekAgo;
    }).length;

    document.getElementById('countAll').textContent = total;
    document.getElementById('countFavorites').textContent = favorites;
    document.getElementById('countRecent').textContent = recent;
}

// 匯出筆記
function exportNotes() {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-notes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 匯入筆記
function importNotes(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedNotes = JSON.parse(event.target.result);
            if (confirm(`確定要匯入 ${importedNotes.length} 個筆記嗎？這將覆蓋現有數據。`)) {
                notes = importedNotes;
                saveNotes();
                renderNotesList();
                updateStats();
                if (notes.length > 0) {
                    openNote(notes[0].id);
                }
            }
        } catch (error) {
            alert('匯入失敗：無效的 JSON 文件');
        }
    };
    reader.readAsText(file);
}

// 鍵盤快捷鍵
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N - 新增筆記
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }

    // Ctrl/Cmd + S - 手動儲存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNotes();
    }

    // Ctrl/Cmd + F - 搜尋
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }

    // Ctrl/Cmd + B - 粗體
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && document.activeElement === markdownEditor) {
        e.preventDefault();
        handleToolbarAction('bold');
    }

    // Ctrl/Cmd + I - 斜體
    if ((e.ctrlKey || e.metaKey) && e.key === 'i' && document.activeElement === markdownEditor) {
        e.preventDefault();
        handleToolbarAction('italic');
    }

    // Ctrl/Cmd + K - 連結
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && document.activeElement === markdownEditor) {
        e.preventDefault();
        handleToolbarAction('link');
    }
}

// 工具函數
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;

    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', init);

// 匯出全域函數供 HTML 調用
window.createNewNote = createNewNote;
window.openNote = openNote;
window.removeTag = removeTag;
window.filterByTag = filterByTag;
