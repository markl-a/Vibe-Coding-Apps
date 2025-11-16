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

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', init);

// 匯出全域函數供 HTML 調用
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.openEditModal = openEditModal;
