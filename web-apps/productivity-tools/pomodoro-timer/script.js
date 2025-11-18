// 計時器狀態
const MODES = {
    work: 'work',
    shortBreak: 'shortBreak',
    longBreak: 'longBreak'
};

// 應用狀態
let currentMode = MODES.work;
let timeLeft = 25 * 60; // 秒
let isRunning = false;
let timerInterval = null;
let completedPomodoros = 0;
let totalFocusTime = 0;

// 設定
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    autoStartBreak: false
};

// DOM 元素
const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const completedCountEl = document.getElementById('completedCount');
const totalTimeEl = document.getElementById('totalTime');
const progressCircle = document.getElementById('progressCircle');
const timerDisplayEl = document.querySelector('.timer-display');

// 模式按鈕
const modeBtns = document.querySelectorAll('.mode-btn');

// 設定輸入
const workDurationInput = document.getElementById('workDuration');
const shortBreakInput = document.getElementById('shortBreakDuration');
const longBreakInput = document.getElementById('longBreakDuration');
const soundEnabledInput = document.getElementById('soundEnabled');
const autoStartBreakInput = document.getElementById('autoStartBreak');

// 初始化
function init() {
    loadSettings();
    loadStats();
    updateDisplay();
    attachEventListeners();
}

// 載入設定
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
        workDurationInput.value = settings.workDuration;
        shortBreakInput.value = settings.shortBreakDuration;
        longBreakInput.value = settings.longBreakDuration;
        soundEnabledInput.checked = settings.soundEnabled;
        autoStartBreakInput.checked = settings.autoStartBreak;
    }
}

// 儲存設定
function saveSettings() {
    settings.workDuration = parseInt(workDurationInput.value);
    settings.shortBreakDuration = parseInt(shortBreakInput.value);
    settings.longBreakDuration = parseInt(longBreakInput.value);
    settings.soundEnabled = soundEnabledInput.checked;
    settings.autoStartBreak = autoStartBreakInput.checked;

    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));

    // 如果計時器未運行，更新時間
    if (!isRunning) {
        resetTimer();
    }
}

// 載入統計數據
function loadStats() {
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        completedPomodoros = stats.completed || 0;
        totalFocusTime = stats.totalTime || 0;
        updateStats();
    }
}

// 儲存統計數據
function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify({
        completed: completedPomodoros,
        totalTime: totalFocusTime
    }));
}

// 綁定事件監聽器
function attachEventListeners() {
    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // 設定變更事件
    [workDurationInput, shortBreakInput, longBreakInput, soundEnabledInput, autoStartBreakInput]
        .forEach(input => {
            input.addEventListener('change', saveSettings);
        });
}

// 切換模式
function switchMode(mode) {
    if (isRunning) {
        stopTimer();
    }

    currentMode = mode;

    // 更新按鈕狀態
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // 更新顏色
    updateModeColor();

    resetTimer();
}

// 更新模式顏色
function updateModeColor() {
    const colors = {
        work: '#4CAF50',
        shortBreak: '#2196F3',
        longBreak: '#FF9800'
    };

    progressCircle.style.stroke = colors[currentMode];

    modeBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            btn.style.background = colors[currentMode];
        }
    });
}

// 切換計時器
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// 開始計時器
function startTimer() {
    isRunning = true;
    startBtn.textContent = '暫停';
    timerDisplayEl.classList.add('running');

    timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
            timerComplete();
        }

        updateDisplay();
    }, 1000);
}

// 暫停計時器
function pauseTimer() {
    stopTimer();
    startBtn.textContent = '繼續';
}

// 停止計時器
function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerDisplayEl.classList.remove('running');
}

// 重置計時器
function resetTimer() {
    stopTimer();
    startBtn.textContent = '開始';

    const durations = {
        work: settings.workDuration,
        shortBreak: settings.shortBreakDuration,
        longBreak: settings.longBreakDuration
    };

    timeLeft = durations[currentMode] * 60;
    updateDisplay();
}

// 計時器完成
function timerComplete() {
    stopTimer();

    // 播放音效
    if (settings.soundEnabled) {
        playNotificationSound();
    }

    // 如果是工作模式完成
    if (currentMode === MODES.work) {
        completedPomodoros++;
        totalFocusTime += settings.workDuration;
        updateStats();
        saveStats();

        // 顯示通知
        showNotification('番茄鐘完成！', '太棒了！休息一下吧 🎉');

        // 自動切換到休息模式
        const nextMode = completedPomodoros % 4 === 0 ? MODES.longBreak : MODES.shortBreak;
        switchMode(nextMode);

        if (settings.autoStartBreak) {
            setTimeout(() => startTimer(), 1000);
        }
    } else {
        // 休息完成
        showNotification('休息結束！', '準備好開始下一個番茄鐘了嗎？ 💪');
        switchMode(MODES.work);
    }
}

// 更新顯示
function updateDisplay() {
    // 更新時間顯示
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // 更新進度圓環
    const durations = {
        work: settings.workDuration * 60,
        shortBreak: settings.shortBreakDuration * 60,
        longBreak: settings.longBreakDuration * 60
    };

    const totalTime = durations[currentMode];
    const progress = (totalTime - timeLeft) / totalTime;
    const circumference = 2 * Math.PI * 140; // r = 140
    const offset = circumference - (progress * circumference);

    progressCircle.style.strokeDashoffset = offset;

    // 更新頁面標題
    document.title = `${timeDisplay.textContent} - 番茄鐘計時器`;
}

// 更新統計數據
function updateStats() {
    completedCountEl.textContent = completedPomodoros;
    totalTimeEl.textContent = totalFocusTime;
}

// 播放通知音效
function playNotificationSound() {
    // 使用 Web Audio API 生成簡單的提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// 顯示通知
function showNotification(title, body) {
    // 檢查瀏覽器是否支援通知
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '🍅' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '🍅' });
                }
            });
        }
    }
}

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // 空格鍵：開始/暫停
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
    }

    // R 鍵：重置
    if (e.code === 'KeyR' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        resetTimer();
    }
});

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', init);

// 請求通知權限
if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => {
        Notification.requestPermission();
    }, 2000);
}

// ===== AI 智能功能 =====

// AI 分析類
class AIInsights {
    constructor() {
        this.sessionHistory = this.loadSessionHistory();
    }

    // 載入會話歷史
    loadSessionHistory() {
        const history = localStorage.getItem('pomodoroHistory');
        return history ? JSON.parse(history) : [];
    }

    // 儲存會話
    saveSession(type, duration) {
        const session = {
            type, // 'work' or 'break'
            duration,
            timestamp: new Date().toISOString(),
            hour: new Date().getHours()
        };

        this.sessionHistory.push(session);

        // 只保留最近 100 個會話
        if (this.sessionHistory.length > 100) {
            this.sessionHistory = this.sessionHistory.slice(-100);
        }

        localStorage.setItem('pomodoroHistory', JSON.stringify(this.sessionHistory));
    }

    // 生產力分析
    getProductivityInsight(completedPomodoros, totalFocusTime) {
        if (completedPomodoros === 0) {
            return {
                icon: '📊',
                title: '生產力分析',
                text: '完成第一個番茄鐘來開始追蹤你的生產力！'
            };
        }

        if (completedPomodoros < 4) {
            return {
                icon: '🌱',
                title: '生產力分析',
                text: `太好了！你已完成 ${completedPomodoros} 個番茄鐘。保持這個節奏！`
            };
        }

        if (completedPomodoros >= 4 && completedPomodoros < 8) {
            return {
                icon: '🔥',
                title: '生產力分析',
                text: `表現優秀！${completedPomodoros} 個番茄鐘已完成。你的專注力正在提升！`
            };
        }

        if (completedPomodoros >= 8) {
            return {
                icon: '🏆',
                title: '生產力分析',
                text: `驚人的成就！${completedPomodoros} 個番茄鐘！你是生產力大師！`
            };
        }
    }

    // 休息建議
    getRestSuggestion(completedPomodoros, currentMode) {
        if (currentMode === MODES.work && completedPomodoros > 0) {
            const hoursSinceStart = totalFocusTime / 60;

            if (hoursSinceStart > 2) {
                return {
                    icon: '🧘',
                    title: '休息建議',
                    text: '你已經專注工作超過 2 小時了！建議做一些伸展運動或散步。'
                };
            }

            if (completedPomodoros % 4 === 3) {
                return {
                    icon: '☕',
                    title: '休息建議',
                    text: '完成下一個番茄鐘後，記得休息 15 分鐘來恢復精力！'
                };
            }

            return {
                icon: '💪',
                title: '休息建議',
                text: '保持專注！短暫休息後繼續前進。'
            };
        }

        if (currentMode !== MODES.work) {
            return {
                icon: '🌟',
                title: '休息建議',
                text: '好好休息！大腦需要時間來處理和記憶信息。'
            };
        }

        return {
            icon: '💡',
            title: '休息建議',
            text: '開始第一個番茄鐘，我會給你智能休息建議！'
        };
    }

    // 工作模式分析
    getPatternInsight() {
        if (this.sessionHistory.length < 5) {
            return {
                icon: '📈',
                title: '工作模式',
                text: '收集更多數據來分析你的工作模式...'
            };
        }

        // 分析最佳工作時段
        const hourStats = {};
        this.sessionHistory
            .filter(s => s.type === 'work')
            .forEach(session => {
                hourStats[session.hour] = (hourStats[session.hour] || 0) + 1;
            });

        if (Object.keys(hourStats).length === 0) {
            return {
                icon: '🎯',
                title: '工作模式',
                text: '開始追蹤你的工作模式！'
            };
        }

        const bestHour = Object.entries(hourStats)
            .sort((a, b) => b[1] - a[1])[0][0];

        const timeRange = this.getTimeRange(parseInt(bestHour));

        return {
            icon: '⭐',
            title: '工作模式',
            text: `你在 ${timeRange} 最有生產力！這是你的黃金時段。`
        };
    }

    getTimeRange(hour) {
        if (hour >= 6 && hour < 12) return '早上';
        if (hour >= 12 && hour < 14) return '中午';
        if (hour >= 14 && hour < 18) return '下午';
        if (hour >= 18 && hour < 22) return '晚上';
        return '深夜';
    }

    // 獲取所有洞察
    getAllInsights(completedPomodoros, totalFocusTime, currentMode) {
        return {
            productivity: this.getProductivityInsight(completedPomodoros, totalFocusTime),
            rest: this.getRestSuggestion(completedPomodoros, currentMode),
            pattern: this.getPatternInsight()
        };
    }
}

// 初始化 AI
const aiInsights = new AIInsights();

// 更新 AI 洞察顯示
function updateAIInsights() {
    const insights = aiInsights.getAllInsights(completedPomodoros, totalFocusTime, currentMode);

    // 更新生產力洞察
    const productivityEl = document.getElementById('productivityInsight');
    productivityEl.querySelector('.insight-icon').textContent = insights.productivity.icon;
    productivityEl.querySelector('.insight-title').textContent = insights.productivity.title;
    productivityEl.querySelector('.insight-text').textContent = insights.productivity.text;

    // 更新休息建議
    const restEl = document.getElementById('restSuggestion');
    restEl.querySelector('.insight-icon').textContent = insights.rest.icon;
    restEl.querySelector('.insight-title').textContent = insights.rest.title;
    restEl.querySelector('.insight-text').textContent = insights.rest.text;

    // 更新工作模式
    const patternEl = document.getElementById('patternInsight');
    patternEl.querySelector('.insight-icon').textContent = insights.pattern.icon;
    patternEl.querySelector('.insight-title').textContent = insights.pattern.title;
    patternEl.querySelector('.insight-text').textContent = insights.pattern.text;
}

// 修改原有的 timerComplete 函數以記錄會話
const originalTimerComplete = timerComplete;
function timerComplete() {
    // 記錄會話
    const durations = {
        work: settings.workDuration,
        shortBreak: settings.shortBreakDuration,
        longBreak: settings.longBreakDuration
    };

    aiInsights.saveSession(
        currentMode === MODES.work ? 'work' : 'break',
        durations[currentMode]
    );

    // 調用原始函數
    originalTimerComplete();

    // 更新 AI 洞察
    updateAIInsights();
}

// 在初始化時更新 AI 洞察
const originalInit = init;
function init() {
    originalInit();
    updateAIInsights();
}
