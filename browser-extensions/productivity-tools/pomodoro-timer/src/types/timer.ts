export type TimerStatus = 'idle' | 'running' | 'paused';
export type SessionType = 'work' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface TimerState {
  status: TimerStatus;
  sessionType: SessionType;
  timeRemaining: number; // in seconds
  completedPomodoros: number;
  currentPomodoroInCycle: number;
}

export interface PomodoroStats {
  totalPomodoros: number;
  totalFocusTime: number; // in minutes
  dailyPomodoros: { [date: string]: number };
  weeklyPomodoros: number;
  monthlyPomodoros: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'auto',
};

export const DEFAULT_STATE: TimerState = {
  status: 'idle',
  sessionType: 'work',
  timeRemaining: 25 * 60,
  completedPomodoros: 0,
  currentPomodoroInCycle: 0,
};
