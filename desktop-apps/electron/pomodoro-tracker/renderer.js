// 全域變數
let timerInterval = null;
let timeRemaining = 0;
let isRunning = false;
let currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
let pomodoroCount = 0;
let completedToday = 0;

// 設定
let config = {
  workDuration: 1500, // 25分鐘
  shortBreak: 300, // 5分鐘
  longBreak: 900, // 15分鐘
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: true,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'light',
  dailyGoal: 8
};

// DOM 元素
const timerDisplay = document.getElementById('timerDisplay');
const timerStatus = document.getElementById('timerStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const pomodoroCountEl = document.getElementById('pomodoroCount');
const dailyGoalEl = document.getElementById('dailyGoal');

// 初始化
async function init() {
  await loadConfig();
  await loadStats();
  await loadTasks();
  updateDisplay();
  setupEventListeners();
  applyTheme(config.theme);
}

// 載入設定
async function loadConfig() {
  const savedConfig = await window.electronAPI.getConfig('config', null);
  if (savedConfig) {
    config = { ...config, ...savedConfig };
  }
  timeRemaining = config.workDuration;
  dailyGoalEl.textContent = config.dailyGoal;
}

// 儲存設定
async function saveConfig() {
  await window.electronAPI.setConfig('config', config);
}

// 載入統計
async function loadStats() {
  const stats = await window.electronAPI.getStats();
  completedToday = stats.todayPomodoros || 0;
  pomodoroCountEl.textContent = completedToday;
  updateStatsDisplay(stats);
}

// 儲存統計
async function saveStats() {
  const stats = await window.electronAPI.getStats();
  stats.todayPomodoros = completedToday;
  stats.totalPomodoros = (stats.totalPomodoros || 0) + 1;
  await window.electronAPI.saveStats(stats);
  updateStatsDisplay(stats);
  checkAchievements(stats);
}

// 事件監聽器
function setupEventListeners() {
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipPhase);

  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  document.getElementById('statsBtn').addEventListener('click', toggleStats);
  document.getElementById('settingsBtn').addEventListener('click', toggleSettings);
  document.getElementById('closeStatsBtn').addEventListener('click', () => {
    document.getElementById('statsSection').style.display = 'none';
  });
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsSection').style.display = 'none';
  });

  // 任務相關
  document.getElementById('addTaskBtn').addEventListener('click', showTaskInput);
  document.getElementById('saveTaskBtn').addEventListener('click', saveTask);
  document.getElementById('cancelTaskBtn').addEventListener('click', hideTaskInput);
  document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveTask();
    if (e.key === 'Escape') hideTaskInput();
  });

  // 設定相關
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

  // 托盤事件
  window.electronAPI.onTrayToggleTimer(() => {
    if (isRunning) pauseTimer();
    else startTimer();
  });

  window.electronAPI.onShowSettings(() => {
    toggleSettings();
  });

  // 快捷鍵
  document.addEventListener('keydown', handleKeyPress);
}

// 計時器控制
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';

  timerInterval = setInterval(() => {
    timeRemaining--;

    if (timeRemaining <= 0) {
      completePhase();
    }

    updateDisplay();
    updateTray();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;

  isRunning = false;
  startBtn.style.display = 'inline-block';
  pauseBtn.style.display = 'none';

  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();

  if (currentMode === 'work') {
    timeRemaining = config.workDuration;
  } else if (currentMode === 'shortBreak') {
    timeRemaining = config.shortBreak;
  } else {
    timeRemaining = config.longBreak;
  }

  updateDisplay();
}

function skipPhase() {
  completePhase();
}

async function completePhase() {
  pauseTimer();

  if (currentMode === 'work') {
    pomodoroCount++;
    completedToday++;
    pomodoroCountEl.textContent = completedToday;
    await saveStats();

    // 決定下一個階段
    if (pomodoroCount % config.pomodorosUntilLongBreak === 0) {
      currentMode = 'longBreak';
      timeRemaining = config.longBreak;
    } else {
      currentMode = 'shortBreak';
      timeRemaining = config.shortBreak;
    }

    await showNotification('🎉 番茄鐘完成!', '該休息一下了!');
  } else {
    currentMode = 'work';
    timeRemaining = config.workDuration;
    await showNotification('⏰ 休息結束!', '準備開始新的番茄鐘!');
  }

  updateDisplay();

  if (config.autoStartBreaks && currentMode !== 'work') {
    setTimeout(() => startTimer(), 1000);
  } else if (currentMode === 'work' && config.autoStartPomodoros) {
    setTimeout(() => startTimer(), 1000);
  }
}

// 顯示更新
function updateDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (currentMode === 'work') {
    timerStatus.textContent = '🍅 工作時間';
    timerDisplay.style.color = 'var(--accent-color)';
  } else if (currentMode === 'shortBreak') {
    timerStatus.textContent = '☕ 短休息';
    timerDisplay.style.color = 'var(--success-color)';
  } else {
    timerStatus.textContent = '🌟 長休息';
    timerDisplay.style.color = 'var(--info-color)';
  }

  document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Pomodoro`;
}

async function updateTray() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const text = `Pomodoro - ${minutes}:${seconds.toString().padStart(2, '0')}`;
  await window.electronAPI.updateTray(text);
}

// 通知
async function showNotification(title, body) {
  if (config.notificationsEnabled) {
    await window.electronAPI.showNotification(title, body);
  }
  if (config.soundEnabled) {
    playSound();
  }
}

function playSound() {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKvn77BZGAg+ltryxnElBSp+zPDajTgHG2e57uSVTA0NUKjl8LNeFQVIot/yuFceAy965fDdlEMJElem5+yrXBwKPpbY8MSELQUxhM/xz30qBB1tvuvnm0oMClGp5vGzXhsJPJXY77yDKgUuhM/wzXkpBB5yvfDim0kKClCp5fGzXhsJPJbZ8L2DKgUthM7xzXkpBB5zv/Dkm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xzHkpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgUthM7xy3kpBB1zvvDjm0gKC1Kr5vKzXBoJPZfZ8L6EKgU=');
  audio.play().catch(() => {});
}

// 主題切換
function toggleTheme() {
  config.theme = config.theme === 'light' ? 'dark' : 'light';
  applyTheme(config.theme);
  saveConfig();
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeBtn').textContent = '☀️';
  } else {
    document.body.classList.remove('dark-theme');
    document.getElementById('themeBtn').textContent = '🌙';
  }
}

// 統計顯示
function toggleStats() {
  const statsSection = document.getElementById('statsSection');
  statsSection.style.display = statsSection.style.display === 'none' ? 'block' : 'none';
  document.getElementById('settingsSection').style.display = 'none';
}

async function updateStatsDisplay(stats) {
  document.getElementById('totalPomodoros').textContent = stats.totalPomodoros || 0;
  document.getElementById('todayPomodoros').textContent = stats.todayPomodoros || 0;

  const weekTotal = (stats.weekPomodoros || []).reduce((a, b) => a + b, 0);
  document.getElementById('weekPomodoros').textContent = weekTotal;

  const completionRate = Math.round((stats.todayPomodoros || 0) / config.dailyGoal * 100);
  document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// 成就系統
async function checkAchievements(stats) {
  const achievements = [
    { id: 'first', emoji: '🌱', condition: stats.totalPomodoros >= 1 },
    { id: 'five', emoji: '🔥', condition: stats.todayPomodoros >= 5 },
    { id: 'ten', emoji: '💪', condition: stats.todayPomodoros >= 10 },
    { id: 'hundred', emoji: '👑', condition: stats.totalPomodoros >= 100 },
    { id: 'fivehundred', emoji: '🚀', condition: stats.totalPomodoros >= 500 },
    { id: 'thousand', emoji: '💎', condition: stats.totalPomodoros >= 1000 }
  ];

  const achievementsEl = document.getElementById('achievements');
  achievementsEl.innerHTML = achievements.map(ach =>
    `<span class="achievement ${ach.condition ? 'unlocked' : ''}" title="${ach.id}">${ach.emoji}</span>`
  ).join('');
}

// 設定面板
function toggleSettings() {
  const settingsSection = document.getElementById('settingsSection');
  settingsSection.style.display = settingsSection.style.display === 'none' ? 'block' : 'none';
  document.getElementById('statsSection').style.display = 'none';

  // 載入當前設定
  document.getElementById('workDuration').value = config.workDuration / 60;
  document.getElementById('shortBreak').value = config.shortBreak / 60;
  document.getElementById('longBreak').value = config.longBreak / 60;
  document.getElementById('dailyGoalInput').value = config.dailyGoal;
  document.getElementById('autoStartBreaks').checked = config.autoStartBreaks;
  document.getElementById('soundEnabled').checked = config.soundEnabled;
  document.getElementById('notificationsEnabled').checked = config.notificationsEnabled;
}

async function saveSettings() {
  config.workDuration = parseInt(document.getElementById('workDuration').value) * 60;
  config.shortBreak = parseInt(document.getElementById('shortBreak').value) * 60;
  config.longBreak = parseInt(document.getElementById('longBreak').value) * 60;
  config.dailyGoal = parseInt(document.getElementById('dailyGoalInput').value);
  config.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
  config.soundEnabled = document.getElementById('soundEnabled').checked;
  config.notificationsEnabled = document.getElementById('notificationsEnabled').checked;

  await saveConfig();
  dailyGoalEl.textContent = config.dailyGoal;

  if (currentMode === 'work') {
    timeRemaining = config.workDuration;
  }
  updateDisplay();

  document.getElementById('settingsSection').style.display = 'none';
}

// 任務管理
function showTaskInput() {
  document.querySelector('.task-input').style.display = 'flex';
  document.getElementById('newTaskInput').focus();
}

function hideTaskInput() {
  document.querySelector('.task-input').style.display = 'none';
  document.getElementById('newTaskInput').value = '';
}

async function saveTask() {
  const input = document.getElementById('newTaskInput');
  const taskText = input.value.trim();

  if (!taskText) return;

  const tasks = await window.electronAPI.getTasks();
  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString()
  });

  await window.electronAPI.saveTasks(tasks);
  await loadTasks();
  hideTaskInput();
}

async function loadTasks() {
  const tasks = await window.electronAPI.getTasks();
  const tasksList = document.getElementById('tasksList');

  if (tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state">尚無任務,點擊 + 新增</div>';
    return;
  }

  tasksList.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
      <label>${task.text}</label>
      <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
    </div>
  `).join('');
}

async function toggleTask(id) {
  const tasks = await window.electronAPI.getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    await window.electronAPI.saveTasks(tasks);
    await loadTasks();
  }
}

async function deleteTask(id) {
  const tasks = await window.electronAPI.getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await window.electronAPI.saveTasks(filtered);
  await loadTasks();
}

// 快捷鍵
function handleKeyPress(e) {
  if (e.target.tagName === 'INPUT') return;

  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (isRunning) pauseTimer();
    else startTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    resetTimer();
  } else if (e.key === 's' || e.key === 'S') {
    skipPhase();
  } else if (e.key === 't' || e.key === 'T') {
    toggleTheme();
  } else if (e.key === 'n' || e.key === 'N') {
    showTaskInput();
  }
}

// 啟動
init();
