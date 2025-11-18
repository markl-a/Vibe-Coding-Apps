// ===== 時間追蹤器應用 =====

class TimeTracker {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pauseTime = null;
        this.totalPausedTime = 0;
        this.currentEntry = null;
        this.entries = this.loadEntries();
        this.timerInterval = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderEntries();
        this.updateStats();
        this.updateAIInsights();
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('exportBtn').addEventListener('click', () => this.export());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    }

    start() {
        const taskInput = document.getElementById('taskInput');
        const projectSelect = document.getElementById('projectSelect');

        if (!taskInput.value.trim()) {
            alert('請輸入任務名稱！');
            return;
        }

        if (!this.isRunning) {
            // 新開始
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.totalPausedTime = 0;

            this.currentEntry = {
                task: taskInput.value.trim(),
                project: projectSelect.value || 'default',
                startTime: this.startTime,
                endTime: null,
                duration: 0,
                date: new Date().toISOString().split('T')[0]
            };

            this.startTimer();

            // UI 更新
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('stopBtn').disabled = false;
            document.getElementById('timerStatus').textContent = '進行中';

            taskInput.disabled = true;
            projectSelect.disabled = true;
        } else if (this.isPaused) {
            // 從暫停恢復
            this.isPaused = false;
            this.totalPausedTime += Date.now() - this.pauseTime;
            this.startTimer();

            document.getElementById('pauseBtn').textContent = '暫停';
            document.getElementById('timerStatus').textContent = '進行中';
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.pauseTime = Date.now();
            clearInterval(this.timerInterval);

            document.getElementById('pauseBtn').textContent = '繼續';
            document.getElementById('timerStatus').textContent = '已暫停';
        } else if (this.isPaused) {
            this.start();
        }
    }

    stop() {
        if (!this.isRunning) return;

        clearInterval(this.timerInterval);

        const endTime = Date.now();
        const duration = endTime - this.startTime - this.totalPausedTime;

        this.currentEntry.endTime = endTime;
        this.currentEntry.duration = duration;

        // 保存記錄
        this.entries.unshift(this.currentEntry);
        this.saveEntries();

        // 重置狀態
        this.reset();

        // 更新顯示
        this.renderEntries();
        this.updateStats();
        this.updateAIInsights();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pauseTime = null;
        this.totalPausedTime = 0;
        this.currentEntry = null;

        // UI 重置
        document.getElementById('timerDisplay').textContent = '00:00:00';
        document.getElementById('timerStatus').textContent = '就緒';
        document.getElementById('taskInput').value = '';
        document.getElementById('taskInput').disabled = false;
        document.getElementById('projectSelect').value = '';
        document.getElementById('projectSelect').disabled = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暫停';
        document.getElementById('stopBtn').disabled = true;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime - this.totalPausedTime;
            document.getElementById('timerDisplay').textContent = this.formatDuration(elapsed);
        }, 1000);
    }

    // ===== 數據管理 =====

    loadEntries() {
        const stored = localStorage.getItem('timeTrackerEntries');
        return stored ? JSON.parse(stored) : [];
    }

    saveEntries() {
        localStorage.setItem('timeTrackerEntries', JSON.stringify(this.entries));
    }

    // ===== 渲染和統計 =====

    renderEntries() {
        const container = document.getElementById('entriesList');
        const emptyState = document.getElementById('emptyState');

        if (this.entries.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        const entriesHTML = this.entries.map((entry, index) => `
            <div class="entry-item">
                <div class="entry-header">
                    <div class="entry-task">${this.escapeHtml(entry.task)}</div>
                    <div class="entry-duration">${this.formatDuration(entry.duration)}</div>
                </div>
                <div class="entry-meta">
                    <span class="entry-project">${this.getProjectName(entry.project)}</span>
                    <span class="entry-time">${this.formatDate(entry.startTime)}</span>
                    <button class="btn-delete" onclick="timeTracker.deleteEntry(${index})">🗑️</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = entriesHTML;
    }

    deleteEntry(index) {
        if (confirm('確定要刪除這條記錄嗎？')) {
            this.entries.splice(index, 1);
            this.saveEntries();
            this.renderEntries();
            this.updateStats();
            this.updateAIInsights();
        }
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayTotal = this.entries
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + e.duration, 0);

        const weekTotal = this.entries
            .filter(e => new Date(e.startTime) >= weekAgo)
            .reduce((sum, e) => sum + e.duration, 0);

        const monthTotal = this.entries
            .filter(e => new Date(e.startTime) >= monthAgo)
            .reduce((sum, e) => sum + e.duration, 0);

        const total = this.entries.reduce((sum, e) => sum + e.duration, 0);

        document.getElementById('statToday').textContent = this.formatHours(todayTotal);
        document.getElementById('statWeek').textContent = this.formatHours(weekTotal);
        document.getElementById('statMonth').textContent = this.formatHours(monthTotal);
        document.getElementById('statTotal').textContent = this.formatHours(total);
        document.getElementById('totalToday').textContent = this.formatDuration(todayTotal);
    }

    // ===== AI 智能分析 =====

    updateAIInsights() {
        if (this.entries.length < 5) {
            document.getElementById('aiProductiveHours').textContent = '--';
            document.getElementById('aiMostProductive').textContent = '--';
            document.getElementById('aiEfficiencyScore').textContent = '--';
            document.getElementById('aiSuggestion').textContent = '💡 至少需要 5 條記錄才能進行 AI 分析！';
            return;
        }

        // 分析最佳工作時段
        const hourStats = {};
        this.entries.forEach(entry => {
            const hour = new Date(entry.startTime).getHours();
            hourStats[hour] = (hourStats[hour] || 0) + entry.duration;
        });

        const bestHours = Object.entries(hourStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([hour]) => `${hour}:00`)
            .join(', ');

        // 分析最高效專案
        const projectStats = {};
        this.entries.forEach(entry => {
            projectStats[entry.project] = (projectStats[entry.project] || 0) + entry.duration;
        });

        const mostProductive = Object.entries(projectStats)
            .sort((a, b) => b[1] - a[1])[0];

        // 計算效率分數
        const avgDuration = this.entries.reduce((sum, e) => sum + e.duration, 0) / this.entries.length;
        const efficiencyScore = Math.min(100, Math.round((avgDuration / (60 * 60 * 1000)) * 20));

        // 更新顯示
        document.getElementById('aiProductiveHours').textContent = bestHours;
        document.getElementById('aiMostProductive').textContent = this.getProjectName(mostProductive[0]);
        document.getElementById('aiEfficiencyScore').textContent = efficiencyScore;

        // AI 建議
        const suggestions = this.getAISuggestions(efficiencyScore, avgDuration);
        document.getElementById('aiSuggestion').textContent = suggestions;
    }

    getAISuggestions(score, avgDuration) {
        const hours = avgDuration / (1000 * 60 * 60);

        if (score >= 80) {
            return '🎉 太棒了！你的工作效率非常高！繼續保持這個節奏。';
        } else if (score >= 60) {
            return '👍 做得不錯！試著在高效時段安排重要任務來進一步提升效率。';
        } else if (hours < 1) {
            return '💪 建議延長每次專注時間到至少 1 小時，這樣能獲得更好的深度工作效果。';
        } else {
            return '🎯 嘗試使用番茄鐘技術，25 分鐘專注 + 5 分鐘休息，提升專注力！';
        }
    }

    // ===== 匯出和清除 =====

    export() {
        const data = {
            entries: this.entries,
            exportDate: new Date().toISOString(),
            totalTime: this.entries.reduce((sum, e) => sum + e.duration, 0)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-tracker-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAll() {
        if (confirm('確定要清除所有記錄嗎？此操作無法復原。')) {
            this.entries = [];
            this.saveEntries();
            this.renderEntries();
            this.updateStats();
            this.updateAIInsights();
        }
    }

    // ===== 工具函數 =====

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    formatHours(ms) {
        const hours = ms / (1000 * 60 * 60);
        return hours.toFixed(1) + 'h';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return '昨天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    getProjectName(key) {
        const names = {
            work: '工作',
            study: '學習',
            personal: '個人',
            meeting: '會議',
            break: '休息',
            default: '其他'
        };
        return names[key] || names.default;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===== 初始化應用 =====
let timeTracker;
document.addEventListener('DOMContentLoaded', () => {
    timeTracker = new TimeTracker();
});
