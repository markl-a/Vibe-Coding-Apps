import { create } from 'zustand';
import { TimerState, TimerSettings, DEFAULT_SETTINGS, DEFAULT_STATE, SessionType } from '../types/timer';

interface TimerStore extends TimerState {
  settings: TimerSettings;
  setStatus: (status: TimerState['status']) => void;
  setSessionType: (type: SessionType) => void;
  setTimeRemaining: (time: number) => void;
  incrementCompletedPomodoros: () => void;
  resetTimer: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...DEFAULT_STATE,
  settings: DEFAULT_SETTINGS,

  setStatus: (status) => {
    set({ status });
    get().saveToStorage();
  },

  setSessionType: (sessionType) => {
    const { settings } = get();
    let timeRemaining: number;

    switch (sessionType) {
      case 'work':
        timeRemaining = settings.workDuration * 60;
        break;
      case 'shortBreak':
        timeRemaining = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        timeRemaining = settings.longBreakDuration * 60;
        break;
    }

    set({ sessionType, timeRemaining, status: 'idle' });
    get().saveToStorage();
  },

  setTimeRemaining: (timeRemaining) => {
    set({ timeRemaining });
  },

  incrementCompletedPomodoros: () => {
    set((state) => ({
      completedPomodoros: state.completedPomodoros + 1,
      currentPomodoroInCycle: (state.currentPomodoroInCycle + 1) % state.settings.pomodorosUntilLongBreak,
    }));
    get().saveToStorage();
  },

  resetTimer: () => {
    const { sessionType, settings } = get();
    let timeRemaining: number;

    switch (sessionType) {
      case 'work':
        timeRemaining = settings.workDuration * 60;
        break;
      case 'shortBreak':
        timeRemaining = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        timeRemaining = settings.longBreakDuration * 60;
        break;
    }

    set({ status: 'idle', timeRemaining });
    get().saveToStorage();
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const result = await chrome.storage.local.get(['timerState', 'timerSettings']);

      if (result.timerState) {
        set(result.timerState);
      }

      if (result.timerSettings) {
        set({ settings: result.timerSettings });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await chrome.storage.local.set({
        timerState: {
          status: state.status,
          sessionType: state.sessionType,
          timeRemaining: state.timeRemaining,
          completedPomodoros: state.completedPomodoros,
          currentPomodoroInCycle: state.currentPomodoroInCycle,
        },
        timerSettings: state.settings,
      });
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
