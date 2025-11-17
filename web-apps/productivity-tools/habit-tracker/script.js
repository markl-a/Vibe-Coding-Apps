// ===== Data Storage and State Management =====
class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.currentFilter = 'all';
        this.editingHabitId = null;
        this.currentDetailHabitId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    // ===== Data Management =====
    loadHabits() {
        const stored = localStorage.getItem('habits');
        return stored ? JSON.parse(stored) : [];
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ===== Event Binding =====
    bindEvents() {
        // Modal events
        document.getElementById('addHabitBtn').addEventListener('click', () => this.openHabitModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleHabitSubmit(e));

        // Detail modal events
        document.getElementById('closeDetailModal').addEventListener('click', () => this.closeDetailModal());

        // Filter events
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Import/Export events
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());
        document.getElementById('importFileInput').addEventListener('change', (e) => this.handleFileImport(e));

        // Close modal on outside click
        document.getElementById('habitModal').addEventListener('click', (e) => {
            if (e.target.id === 'habitModal') this.closeHabitModal();
        });
        document.getElementById('habitDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'habitDetailModal') this.closeDetailModal();
        });
    }

    // ===== Habit CRUD Operations =====
    addHabit(habitData) {
        const habit = {
            id: this.generateId(),
            name: habitData.name,
            description: habitData.description,
            category: habitData.category,
            color: habitData.color,
            createdAt: new Date().toISOString(),
            checkins: [], // Array of date strings (YYYY-MM-DD)
            currentStreak: 0,
            longestStreak: 0
        };

        this.habits.push(habit);
        this.saveHabits();
        this.updateHabitStreaks(habit);
        this.render();
        this.updateStats();
        this.showToast('習慣已新增', 'success');
    }

    updateHabit(id, habitData) {
        const habit = this.habits.find(h => h.id === id);
        if (habit) {
            habit.name = habitData.name;
            habit.description = habitData.description;
            habit.category = habitData.category;
            habit.color = habitData.color;

            this.saveHabits();
            this.render();
            this.showToast('習慣已更新', 'success');
        }
    }

    deleteHabit(id) {
        if (confirm('確定要刪除這個習慣嗎？此操作無法復原。')) {
            this.habits = this.habits.filter(h => h.id !== id);
            this.saveHabits();
            this.render();
            this.updateStats();
            this.showToast('習慣已刪除', 'success');
        }
    }

    // ===== Check-in Management =====
    toggleCheckin(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = this.getTodayString();
        const index = habit.checkins.indexOf(today);

        if (index > -1) {
            // Remove check-in
            habit.checkins.splice(index, 1);
            this.showToast('已取消打卡', 'warning');
        } else {
            // Add check-in
            habit.checkins.push(today);
            habit.checkins.sort();
            this.showToast('打卡成功！', 'success');
        }

        this.updateHabitStreaks(habit);
        this.saveHabits();
        this.render();
        this.updateStats();
    }

    isCheckedToday(habit) {
        return habit.checkins.includes(this.getTodayString());
    }

    getTodayString() {
        const date = new Date();
        return this.formatDate(date);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ===== Streak Calculation =====
    updateHabitStreaks(habit) {
        if (habit.checkins.length === 0) {
            habit.currentStreak = 0;
            habit.longestStreak = 0;
            return;
        }

        const sortedCheckins = [...habit.checkins].sort().reverse();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        const today = new Date();
        const todayStr = this.formatDate(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDate(yesterday);

        // Calculate current streak
        if (sortedCheckins[0] === todayStr || sortedCheckins[0] === yesterdayStr) {
            currentStreak = 1;
            let checkDate = new Date(sortedCheckins[0]);

            for (let i = 1; i < sortedCheckins.length; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const expectedDate = this.formatDate(checkDate);

                if (sortedCheckins[i] === expectedDate) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        longestStreak = tempStreak;
        for (let i = 1; i < sortedCheckins.length; i++) {
            const currentDate = new Date(sortedCheckins[i]);
            const prevDate = new Date(sortedCheckins[i - 1]);
            const diffDays = Math.round((prevDate - currentDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        habit.currentStreak = currentStreak;
        habit.longestStreak = Math.max(longestStreak, currentStreak);
    }

    // ===== Statistics Calculation =====
    calculateCompletionRate(habit) {
        const createdDate = new Date(habit.createdAt);
        const today = new Date();
        const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
        const completions = habit.checkins.length;

        return daysSinceCreation > 0 ? Math.round((completions / daysSinceCreation) * 100) : 0;
    }

    updateStats() {
        const totalHabits = this.habits.length;
        const todayCompleted = this.habits.filter(h => this.isCheckedToday(h)).length;
        const longestStreak = Math.max(...this.habits.map(h => h.longestStreak), 0);

        let totalDays = 0;
        let totalCheckins = 0;

        this.habits.forEach(habit => {
            const createdDate = new Date(habit.createdAt);
            const today = new Date();
            const days = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += days;
            totalCheckins += habit.checkins.length;
        });

        const completionRate = totalDays > 0 ? Math.round((totalCheckins / totalDays) * 100) : 0;

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('todayCompleted').textContent = todayCompleted;
        document.getElementById('longestStreak').textContent = longestStreak;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }

    // ===== Rendering =====
    render() {
        const container = document.getElementById('habitsContainer');
        const filteredHabits = this.currentFilter === 'all'
            ? this.habits
            : this.habits.filter(h => h.category === this.currentFilter);

        if (filteredHabits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>${this.currentFilter === 'all' ? '還沒有任何習慣' : '此類別沒有習慣'}</h3>
                    <p>點擊「新增習慣」按鈕開始建立您的第一個習慣</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredHabits.map(habit => this.renderHabitCard(habit)).join('');

        // Bind events for habit cards
        filteredHabits.forEach(habit => {
            document.getElementById(`checkin-${habit.id}`).addEventListener('click', () => this.toggleCheckin(habit.id));
            document.getElementById(`edit-${habit.id}`).addEventListener('click', () => this.openHabitModal(habit.id));
            document.getElementById(`delete-${habit.id}`).addEventListener('click', () => this.deleteHabit(habit.id));
            document.getElementById(`info-${habit.id}`).addEventListener('click', () => this.openDetailModal(habit.id));
        });
    }

    renderHabitCard(habit) {
        const isChecked = this.isCheckedToday(habit);
        const completionRate = this.calculateCompletionRate(habit);
        const categoryNames = {
            health: '健康',
            study: '學習',
            work: '工作',
            entertainment: '娛樂',
            other: '其他'
        };

        return `
            <div class="habit-card" style="border-left-color: ${habit.color};">
                <div class="habit-header">
                    <div class="habit-info" id="info-${habit.id}">
                        <h3 class="habit-title">${this.escapeHtml(habit.name)}</h3>
                        <span class="habit-category">${categoryNames[habit.category]}</span>
                        ${habit.description ? `<p class="habit-description">${this.escapeHtml(habit.description)}</p>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="icon-btn" id="edit-${habit.id}" title="編輯">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete" id="delete-${habit.id}" title="刪除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="habit-stats">
                    <div class="habit-stat">
                        <span class="habit-stat-label">當前連續</span>
                        <span class="habit-stat-value">${habit.currentStreak} 天</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-label">最長連續</span>
                        <span class="habit-stat-value">${habit.longestStreak} 天</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-label">總次數</span>
                        <span class="habit-stat-value">${habit.checkins.length} 次</span>
                    </div>
                </div>

                <div class="habit-progress">
                    <div class="progress-label">
                        <span>完成率</span>
                        <span>${completionRate}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%;"></div>
                    </div>
                </div>

                <button class="checkin-btn ${isChecked ? 'checked' : ''}" id="checkin-${habit.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isChecked
                ? '<polyline points="20 6 9 17 4 12"></polyline>'
                : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
            }
                    </svg>
                    ${isChecked ? '已完成' : '今日打卡'}
                </button>
            </div>
        `;
    }

    // ===== Modal Management =====
    openHabitModal(habitId = null) {
        this.editingHabitId = habitId;
        const modal = document.getElementById('habitModal');
        const form = document.getElementById('habitForm');
        const title = document.getElementById('modalTitle');

        form.reset();

        if (habitId) {
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                title.textContent = '編輯習慣';
                document.getElementById('habitName').value = habit.name;
                document.getElementById('habitDescription').value = habit.description || '';
                document.getElementById('habitCategory').value = habit.category;

                // Select color
                const colorInputs = document.querySelectorAll('input[name="color"]');
                colorInputs.forEach(input => {
                    if (input.value === habit.color) {
                        input.checked = true;
                    }
                });
            }
        } else {
            title.textContent = '新增習慣';
        }

        modal.classList.add('active');
    }

    closeHabitModal() {
        const modal = document.getElementById('habitModal');
        modal.classList.remove('active');
        this.editingHabitId = null;
    }

    handleHabitSubmit(e) {
        e.preventDefault();

        const habitData = {
            name: document.getElementById('habitName').value.trim(),
            description: document.getElementById('habitDescription').value.trim(),
            category: document.getElementById('habitCategory').value,
            color: document.querySelector('input[name="color"]:checked').value
        };

        if (this.editingHabitId) {
            this.updateHabit(this.editingHabitId, habitData);
        } else {
            this.addHabit(habitData);
        }

        this.closeHabitModal();
    }

    // ===== Detail Modal =====
    openDetailModal(habitId) {
        this.currentDetailHabitId = habitId;
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const modal = document.getElementById('habitDetailModal');
        const completionRate = this.calculateCompletionRate(habit);

        document.getElementById('detailHabitName').textContent = habit.name;
        document.getElementById('detailCurrentStreak').textContent = `${habit.currentStreak} 天`;
        document.getElementById('detailLongestStreak').textContent = `${habit.longestStreak} 天`;
        document.getElementById('detailTotalCheckins').textContent = `${habit.checkins.length} 次`;
        document.getElementById('detailCompletionRate').textContent = `${completionRate}%`;

        this.renderHeatmap(habit);
        this.renderTrendChart(habit);

        modal.classList.add('active');
    }

    closeDetailModal() {
        const modal = document.getElementById('habitDetailModal');
        modal.classList.remove('active');
        this.currentDetailHabitId = null;
    }

    // ===== Heatmap Rendering =====
    renderHeatmap(habit) {
        const container = document.getElementById('heatmapContainer');
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364); // Show last 365 days

        const heatmap = document.createElement('div');
        heatmap.className = 'heatmap';

        const checkinMap = new Map();
        habit.checkins.forEach(dateStr => {
            checkinMap.set(dateStr, true);
        });

        let currentDate = new Date(startDate);
        const cells = [];

        while (currentDate <= today) {
            const dateStr = this.formatDate(currentDate);
            const hasCheckin = checkinMap.has(dateStr);
            const level = hasCheckin ? 4 : 0;

            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${level}`;
            cell.title = dateStr;

            cells.push(cell);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        cells.forEach(cell => heatmap.appendChild(cell));
        container.innerHTML = '';
        container.appendChild(heatmap);
    }

    // ===== Trend Chart Rendering =====
    renderTrendChart(habit) {
        const container = document.getElementById('trendChart');
        const days = 30;
        const today = new Date();

        const chart = document.createElement('div');
        chart.className = 'trend-chart';

        const checkinMap = new Map();
        habit.checkins.forEach(dateStr => {
            checkinMap.set(dateStr, true);
        });

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            const hasCheckin = checkinMap.has(dateStr);

            const bar = document.createElement('div');
            bar.className = `chart-bar ${hasCheckin ? 'completed' : ''}`;
            bar.style.height = hasCheckin ? '100%' : '20%';
            bar.setAttribute('data-date', dateStr);

            chart.appendChild(bar);
        }

        container.innerHTML = '';
        container.appendChild(chart);
    }

    // ===== Filter Management =====
    handleFilterChange(e) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.category;
        this.render();
    }

    // ===== Import/Export =====
    exportData() {
        const data = {
            habits: this.habits,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-${this.formatDate(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('資料已匯出', 'success');
    }

    importData() {
        document.getElementById('importFileInput').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.habits && Array.isArray(data.habits)) {
                    if (confirm('匯入資料將會覆蓋現有資料，確定要繼續嗎？')) {
                        this.habits = data.habits;

                        // Recalculate streaks for all habits
                        this.habits.forEach(habit => this.updateHabitStreaks(habit));

                        this.saveHabits();
                        this.render();
                        this.updateStats();
                        this.showToast('資料已匯入', 'success');
                    }
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                this.showToast('匯入失敗：檔案格式錯誤', 'error');
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    }

    // ===== Utility Functions =====
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    window.habitTracker = new HabitTracker();
});
