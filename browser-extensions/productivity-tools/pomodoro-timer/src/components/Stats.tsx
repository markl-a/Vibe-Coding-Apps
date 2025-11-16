import React, { useEffect, useState } from 'react';
import { Trophy, Clock, Target } from 'lucide-react';
import { PomodoroStats } from '../types/timer';

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<PomodoroStats>({
    totalPomodoros: 0,
    totalFocusTime: 0,
    dailyPomodoros: {},
    weeklyPomodoros: 0,
    monthlyPomodoros: 0,
  });

  useEffect(() => {
    loadStats();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pomodoroStats) {
        setStats(changes.pomodoroStats.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadStats = async () => {
    const result = await chrome.storage.local.get(['pomodoroStats']);
    if (result.pomodoroStats) {
      setStats(result.pomodoroStats);
    }
  };

  const getTodayPomodoros = () => {
    const today = new Date().toISOString().split('T')[0];
    return stats.dailyPomodoros[today] || 0;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
        Statistics
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Target className="text-blue-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {getTodayPomodoros()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
        </div>

        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Trophy className="text-yellow-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {stats.totalPomodoros}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>

        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Clock className="text-green-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {Math.floor(stats.totalFocusTime / 60)}h
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Focus</div>
        </div>
      </div>
    </div>
  );
};
