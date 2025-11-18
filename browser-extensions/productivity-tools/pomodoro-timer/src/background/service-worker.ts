// Background service worker for Pomodoro Timer
// Handles timer countdown and notifications

let timerInterval: NodeJS.Timeout | null = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_TIMER':
      startTimer();
      break;
    case 'PAUSE_TIMER':
      pauseTimer();
      break;
    case 'RESET_TIMER':
      resetTimer();
      break;
    case 'SESSION_COMPLETE':
      handleSessionComplete(message.sessionType);
      break;
  }
});

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(async () => {
    const result = await chrome.storage.local.get(['timerState']);
    const timerState = result.timerState;

    if (!timerState || timerState.status !== 'running') {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;
    }

    const newTimeRemaining = timerState.timeRemaining - 1;

    if (newTimeRemaining <= 0) {
      // Session complete
      handleSessionComplete(timerState.sessionType);
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    } else {
      // Update time
      await chrome.storage.local.set({
        timerState: {
          ...timerState,
          timeRemaining: newTimeRemaining,
        },
      });
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

async function handleSessionComplete(sessionType: string) {
  const result = await chrome.storage.local.get(['timerSettings', 'timerState']);
  const settings = result.timerSettings;
  const state = result.timerState;

  // Show notification
  if (settings?.notificationsEnabled) {
    let title = '';
    let message = '';

    if (sessionType === 'work') {
      title = '🎉 Pomodoro Complete!';
      message = 'Great work! Time for a break.';
    } else {
      title = '✨ Break Complete!';
      message = 'Ready to focus again?';
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title,
      message,
      priority: 2,
    });
  }

  // Play sound
  if (settings?.soundEnabled) {
    // Sound would be played here if we had an audio file
    // For now, we'll use the notification sound
  }

  // Update stats and session history
  if (sessionType === 'work') {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();

    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Update stats
    const statsResult = await chrome.storage.local.get(['pomodoroStats', 'sessionHistory']);
    const stats = statsResult.pomodoroStats || {
      totalPomodoros: 0,
      totalFocusTime: 0,
      dailyPomodoros: {},
      weeklyPomodoros: 0,
      monthlyPomodoros: 0,
    };

    stats.totalPomodoros += 1;
    stats.totalFocusTime += settings.workDuration;
    stats.dailyPomodoros[today] = (stats.dailyPomodoros[today] || 0) + 1;

    // Update session history for AI analysis
    const sessionHistory = statsResult.sessionHistory || [];

    // Find or create today's session record
    let todaySession = sessionHistory.find((s: any) => s.date === today);
    if (!todaySession) {
      todaySession = {
        date: today,
        pomodoros: 0,
        focusTime: 0,
        completionRate: 1.0,
        timeOfDay: timeOfDay,
        dayOfWeek: now.getDay()
      };
      sessionHistory.push(todaySession);
    }

    todaySession.pomodoros += 1;
    todaySession.focusTime += settings.workDuration;
    // Assume completion if session ended naturally
    todaySession.completionRate = (todaySession.completionRate + 1.0) / 2;

    // Keep only last 30 days of history
    if (sessionHistory.length > 30) {
      sessionHistory.shift();
    }

    await chrome.storage.local.set({
      pomodoroStats: stats,
      sessionHistory: sessionHistory
    });
  }

  // Determine next session
  let nextSessionType = 'work';
  if (sessionType === 'work') {
    const nextCycle = (state.currentPomodoroInCycle + 1) % settings.pomodorosUntilLongBreak;
    nextSessionType = nextCycle === 0 ? 'longBreak' : 'shortBreak';
  }

  // Auto-start next session if enabled
  const shouldAutoStart = sessionType === 'work'
    ? settings.autoStartBreaks
    : settings.autoStartPomodoros;

  let newTimeRemaining: number;
  switch (nextSessionType) {
    case 'work':
      newTimeRemaining = settings.workDuration * 60;
      break;
    case 'shortBreak':
      newTimeRemaining = settings.shortBreakDuration * 60;
      break;
    case 'longBreak':
      newTimeRemaining = settings.longBreakDuration * 60;
      break;
  }

  await chrome.storage.local.set({
    timerState: {
      ...state,
      sessionType: nextSessionType,
      timeRemaining: newTimeRemaining,
      status: shouldAutoStart ? 'running' : 'idle',
      completedPomodoros: sessionType === 'work' ? state.completedPomodoros + 1 : state.completedPomodoros,
      currentPomodoroInCycle: sessionType === 'work'
        ? (state.currentPomodoroInCycle + 1) % settings.pomodorosUntilLongBreak
        : state.currentPomodoroInCycle,
    },
  });

  if (shouldAutoStart) {
    startTimer();
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Pomodoro Timer Extension installed');
});
