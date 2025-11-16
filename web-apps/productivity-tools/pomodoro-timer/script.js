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
