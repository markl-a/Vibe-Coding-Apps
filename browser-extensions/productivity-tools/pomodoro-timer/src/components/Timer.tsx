import React from 'react';
import { useTimerStore } from '../store/timerStore';
import { formatTime } from '../utils/timeFormat';

export const Timer: React.FC = () => {
  const { timeRemaining, sessionType, status } = useTimerStore();

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return 'text-red-500';
      case 'shortBreak':
        return 'text-green-500';
      case 'longBreak':
        return 'text-blue-500';
    }
  };

  const getProgressPercentage = () => {
    const { settings } = useTimerStore.getState();
    let totalTime: number;

    switch (sessionType) {
      case 'work':
        totalTime = settings.workDuration * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakDuration * 60;
        break;
    }

    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className={`text-lg font-semibold mb-4 ${getSessionColor()}`}>
        {getSessionLabel()}
      </h2>

      <div className="relative w-64 h-64 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgressPercentage() / 100)}`}
            className={`transition-all duration-1000 ${getSessionColor()}`}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 dark:text-white">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {status === 'running' ? 'In Progress' : status === 'paused' ? 'Paused' : 'Ready'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
