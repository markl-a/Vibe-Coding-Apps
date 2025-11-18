// 應用狀態
let tasks = [];
let currentFilter = 'all';
let currentPriorityFilter = null;
let currentSort = 'created';
let searchQuery = '';
let editingTaskId = null;

// DOM 元素
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskPriority = document.getElementById('taskPriority');
const addTaskForm = document.getElementById('addTaskForm');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterItems = document.querySelectorAll('.filter-item');
const priorityItems = document.querySelectorAll('.priority-item');
const clearCompletedBtn = document.getElementById('clearCompleted');
const exportDataBtn = document.getElementById('exportData');

// 模態框元素
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskDesc = document.getElementById('editTaskDesc');
const editTaskDate = document.getElementById('editTaskDate');
const editTaskPriority = document.getElementById('editTaskPriority');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');

// 初始化
function init() {
    loadTasks();
    attachEventListeners();
    renderTasks();
    updateStats();
}

// 載入任務
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// 儲存任務
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 綁定事件監聽器
function attachEventListeners() {
    // 添加任務
    addTaskForm.addEventListener('submit', handleAddTask);

    // 搜尋
    searchInput.addEventListener('input', handleSearch);

    // 排序
    sortSelect.addEventListener('change', handleSort);

    // 篩選
    filterItems.forEach(item => {
        item.addEventListener('click', () => handleFilterClick(item));
    });

    priorityItems.forEach(item => {
        item.addEventListener('click', () => handlePriorityClick(item));
    });

    // 清除已完成
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // 匯出數據
    exportDataBtn.addEventListener('click', exportData);

    // 模態框
    closeModalBtn.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    editTaskForm.addEventListener('submit', handleEditTask);

    // 點擊模態框外部關閉
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
}

// 添加任務
function handleAddTask(e) {
    e.preventDefault();

    const title = taskInput.value.trim();
    if (!title) return;

    const task = {
        id: Date.now().toString(),
        title,
        description: '',
        completed: false,
        priority: taskPriority.value,
        dueDate: taskDate.value || null,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(task);
    saveTasks();

    // 重置表單
    taskInput.value = '';
    taskDate.value = '';
    taskPriority.value = 'medium';

    renderTasks();
    updateStats();

    // 聚焦回輸入框
    taskInput.focus();
}

// 渲染任務
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    tasksList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');

    // 綁定任務事件
    attachTaskEvents();
}

// 創建任務 HTML
function createTaskHTML(task) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const priorityEmojis = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
    };
    const priorityLabels = {
        urgent: '緊急',
        high: '高',
        medium: '中',
        low: '低'
    };

    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask('${task.id}')"
            >
            <div class="task-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.dueDate ? `
                        <span class="task-date ${isOverdue ? 'overdue' : ''}">
                            📅 ${formatDate(task.dueDate)} ${isOverdue ? '(已逾期)' : ''}
                        </span>
                    ` : ''}
                    <span class="task-priority ${task.priority}">
                        ${priorityEmojis[task.priority]} ${priorityLabels[task.priority]}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" onclick="openEditModal('${task.id}')" title="編輯">
                    ✏️
                </button>
                <button class="task-btn delete" onclick="deleteTask('${task.id}')" title="刪除">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// 綁定任務事件
function attachTaskEvents() {
    // 所有事件都透過 inline handlers 處理
}

// 切換任務完成狀態
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 刪除任務
function deleteTask(taskId) {
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 打開編輯模態框
function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    editTaskTitle.value = task.title;
    editTaskDesc.value = task.description || '';
    editTaskDate.value = task.dueDate || '';
    editTaskPriority.value = task.priority;

    editModal.classList.add('show');
}

// 關閉模態框
function closeModal() {
    editModal.classList.remove('show');
    editingTaskId = null;
}

// 處理編輯任務
function handleEditTask(e) {
    e.preventDefault();

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    task.title = editTaskTitle.value.trim();
    task.description = editTaskDesc.value.trim();
    task.dueDate = editTaskDate.value || null;
    task.priority = editTaskPriority.value;

    saveTasks();
    renderTasks();
    updateStats();
    closeModal();
}

// 獲取篩選後的任務
function getFilteredTasks() {
    let filtered = [...tasks];

    // 根據篩選條件
    if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate === today);
    } else if (currentFilter === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.dueDate && t.dueDate > today);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    }

    // 根據優先級篩選
    if (currentPriorityFilter) {
        filtered = filtered.filter(t => t.priority === currentPriorityFilter);
    }

    // 搜尋
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
    }

    // 排序
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'dueDate':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'title':
                return a.title.localeCompare(b.title);
            case 'created':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    return filtered;
}

// 處理篩選點擊
function handleFilterClick(item) {
    filterItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentFilter = item.dataset.filter;
    currentPriorityFilter = null;
    renderTasks();
}

// 處理優先級點擊
function handlePriorityClick(item) {
    const priority = item.dataset.priority;

    if (currentPriorityFilter === priority) {
        currentPriorityFilter = null;
        priorityItems.forEach(i => i.style.background = '');
    } else {
        currentPriorityFilter = priority;
        priorityItems.forEach(i => i.style.background = '');
        item.style.background = 'var(--background)';
    }

    renderTasks();
}

// 處理搜尋
function handleSearch(e) {
    searchQuery = e.target.value;
    renderTasks();
}

// 處理排序
function handleSort(e) {
    currentSort = e.target.value;
    renderTasks();
}

// 清除已完成任務
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;

    if (completedCount === 0) {
        alert('沒有已完成的任務');
        return;
    }

    if (confirm(`確定要刪除 ${completedCount} 個已完成的任務嗎？`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 匯出數據
function exportData() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 更新統計數據
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = tasks.filter(t => t.dueDate === today).length;
    const upcomingCount = tasks.filter(t => t.dueDate && t.dueDate > today).length;

    // 更新標頭統計
    document.getElementById('totalTasks').textContent = `${total} 個任務`;
    document.getElementById('completedTasks').textContent = `${completed} 已完成`;

    // 更新篩選計數
    document.getElementById('countAll').textContent = total;
    document.getElementById('countToday').textContent = todayCount;
    document.getElementById('countUpcoming').textContent = upcomingCount;
    document.getElementById('countCompleted').textContent = completed;

    // 更新優先級計數
    document.getElementById('countUrgent').textContent = tasks.filter(t => t.priority === 'urgent').length;
    document.getElementById('countHigh').textContent = tasks.filter(t => t.priority === 'high').length;
    document.getElementById('countMedium').textContent = tasks.filter(t => t.priority === 'medium').length;
    document.getElementById('countLow').textContent = tasks.filter(t => t.priority === 'low').length;
}

// 工具函數
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return '今天';
    if (dateStr === tomorrowStr) return '明天';

    return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric'
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // Escape 關閉模態框
    if (e.key === 'Escape' && editModal.classList.contains('show')) {
        closeModal();
    }

    // Ctrl/Cmd + K 聚焦搜尋
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }

    // Ctrl/Cmd + N 聚焦新任務輸入
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        taskInput.focus();
    }
});

// ===== AI 自然語言解析功能 =====

class AITaskParser {
    constructor() {
        this.patterns = {
            // 日期模式
            tomorrow: /明天|tmr|tomorrow/i,
            today: /今天|today/i,
            nextWeek: /下週|下周|next\s*week/i,

            // 優先級模式
            urgent: /緊急|!緊|!urgent|!高|!!!/i,
            high: /高優先|!高|high|!!/i,
            low: /低優先|!低|low|!/i,

            // 標籤模式
            tags: /#(\S+)/g,

            // 時間模式
            time: /(\d{1,2})[:\s]*([0-5]\d)?(?:\s*(上午|下午|AM|PM))?/i
        };
    }

    parse(input) {
        let result = {
            title: input,
            date: null,
            priority: 'medium',
            tags: [],
            suggestions: []
        };

        // 解析日期
        const dateInfo = this.parseDate(input);
        if (dateInfo) {
            result.date = dateInfo.date;
            result.suggestions.push(dateInfo.message);
            result.title = input.replace(dateInfo.matched, '').trim();
        }

        // 解析優先級
        const priorityInfo = this.parsePriority(input);
        if (priorityInfo) {
            result.priority = priorityInfo.priority;
            result.suggestions.push(priorityInfo.message);
            result.title = result.title.replace(priorityInfo.matched, '').trim();
        }

        // 解析標籤
        const tags = this.parseTags(result.title);
        if (tags.length > 0) {
            result.tags = tags;
            result.suggestions.push(`識別到標籤: ${tags.join(', ')}`);
            result.title = result.title.replace(this.patterns.tags, '').trim();
        }

        // 清理標題
        result.title = result.title.replace(/\s+/g, ' ').trim();

        return result;
    }

    parseDate(input) {
        const today = new Date();

        if (this.patterns.today.test(input)) {
            return {
                date: this.formatDate(today),
                matched: input.match(this.patterns.today)[0],
                message: '已設定為今天'
            };
        }

        if (this.patterns.tomorrow.test(input)) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return {
                date: this.formatDate(tomorrow),
                matched: input.match(this.patterns.tomorrow)[0],
                message: '已設定為明天'
            };
        }

        if (this.patterns.nextWeek.test(input)) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return {
                date: this.formatDate(nextWeek),
                matched: input.match(this.patterns.nextWeek)[0],
                message: '已設定為下週'
            };
        }

        return null;
    }

    parsePriority(input) {
        if (this.patterns.urgent.test(input)) {
            return {
                priority: 'urgent',
                matched: input.match(this.patterns.urgent)[0],
                message: '優先級：緊急'
            };
        }

        if (this.patterns.high.test(input)) {
            return {
                priority: 'high',
                matched: input.match(this.patterns.high)[0],
                message: '優先級：高'
            };
        }

        if (this.patterns.low.test(input)) {
            return {
                priority: 'low',
                matched: input.match(this.patterns.low)[0],
                message: '優先級：低'
            };
        }

        return null;
    }

    parseTags(input) {
        const tags = [];
        let match;
        while ((match = this.patterns.tags.exec(input)) !== null) {
            tags.push(match[1]);
        }
        return tags;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// AI 智能助手類
class AIAssistant {
    calculateCompletionRate(tasks) {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }

    calculateProductivityScore(tasks) {
        if (tasks.length === 0) return 0;

        let score = 0;
        const completed = tasks.filter(t => t.completed);

        // 基礎分數：完成數量
        score += completed.length * 10;

        // 優先級獎勵
        completed.forEach(task => {
            if (task.priority === 'urgent') score += 20;
            else if (task.priority === 'high') score += 10;
            else if (task.priority === 'medium') score += 5;
        });

        // 按時完成獎勵
        const today = new Date().toISOString().split('T')[0];
        const onTime = completed.filter(t =>
            !t.dueDate || new Date(t.dueDate) >= new Date(t.completedAt)
        ).length;
        score += onTime * 5;

        return Math.min(100, score);
    }

    getSmartInsight(tasks) {
        if (tasks.length === 0) {
            return '開始添加任務，AI 會給你智能建議！';
        }

        const activeTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = activeTasks.filter(t => t.dueDate === today);
        const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today);
        const urgentTasks = activeTasks.filter(t => t.priority === 'urgent');

        if (overdueTasks.length > 0) {
            return `⚠️ 你有 ${overdueTasks.length} 個逾期任務需要處理！建議優先完成這些任務。`;
        }

        if (urgentTasks.length > 0) {
            return `🔥 你有 ${urgentTasks.length} 個緊急任務。建議專注於這些高優先級任務。`;
        }

        if (todayTasks.length > 0) {
            return `📅 今天有 ${todayTasks.length} 個任務待完成。你可以的！`;
        }

        if (completedTasks.length > activeTasks.length && activeTasks.length > 0) {
            return `🎉 做得好！你已完成大部分任務，繼續保持！`;
        }

        if (activeTasks.length > 10) {
            return `💡 任務清單較長。建議將大任務分解成小任務，更容易完成。`;
        }

        if (activeTasks.length === 0 && completedTasks.length > 0) {
            return `✨ 太棒了！所有任務都已完成。休息一下或添加新任務吧！`;
        }

        return `💪 保持專注！你正在穩步推進任務。`;
    }
}

// 初始化 AI 功能
const aiParser = new AITaskParser();
const aiAssistant = new AIAssistant();

// AI 建議顯示元素
const aiSuggestion = document.getElementById('aiSuggestion');
const aiSuggestionText = aiSuggestion.querySelector('.suggestion-text');

// 監聽輸入框變化
taskInput.addEventListener('input', function(e) {
    const input = e.target.value;

    if (input.length > 3) {
        const parsed = aiParser.parse(input);

        if (parsed.suggestions.length > 0) {
            aiSuggestionText.textContent = 'AI 解析: ' + parsed.suggestions.join(' | ');
            aiSuggestion.style.display = 'block';

            // 自動填充
            if (parsed.date) taskDate.value = parsed.date;
            if (parsed.priority) taskPriority.value = parsed.priority;
        } else {
            aiSuggestion.style.display = 'none';
        }
    } else {
        aiSuggestion.style.display = 'none';
    }
});

// 修改原有的 handleAddTask 使用 AI 解析
const originalHandleAddTask = handleAddTask;
function handleAddTask(e) {
    e.preventDefault();

    const input = taskInput.value.trim();
    if (!input) return;

    // 使用 AI 解析
    const parsed = aiParser.parse(input);

    const task = {
        id: Date.now().toString(),
        title: parsed.title,
        description: parsed.tags.length > 0 ? `標籤: ${parsed.tags.join(', ')}` : '',
        completed: false,
        priority: parsed.priority,
        dueDate: parsed.date || taskDate.value || null,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(task);
    saveTasks();

    // 重置表單
    taskInput.value = '';
    taskDate.value = '';
    taskPriority.value = 'medium';
    aiSuggestion.style.display = 'none';

    renderTasks();
    updateStats();
    updateAIAssistant();

    // 聚焦回輸入框
    taskInput.focus();
}

// 更新 AI 助手
function updateAIAssistant() {
    const completionRate = aiAssistant.calculateCompletionRate(tasks);
    const productivityScore = aiAssistant.calculateProductivityScore(tasks);
    const insight = aiAssistant.getSmartInsight(tasks);

    document.getElementById('aiCompletionRate').textContent = completionRate + '%';
    document.getElementById('aiProductivityScore').textContent = productivityScore;
    document.querySelector('.ai-insight-text').textContent = insight;
}

// 修改原有的 init
const originalInit = init;
function init() {
    originalInit();
    updateAIAssistant();
}

// 修改原有的 toggleTask 以更新 AI 助手
const originalToggleTask = toggleTask;
function toggleTask(taskId) {
    originalToggleTask(taskId);
    updateAIAssistant();
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', init);

// 匯出全域函數供 HTML 調用
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.openEditModal = openEditModal;
