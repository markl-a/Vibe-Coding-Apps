import React, { useEffect, useState } from 'react';
import { Timer } from '../components/Timer';
import { Controls } from '../components/Controls';
import { Stats } from '../components/Stats';
import { AIInsights } from '../components/AIInsights';
import { useTimerStore } from '../store/timerStore';

function App() {
  const { loadFromStorage, timeRemaining, status } = useTimerStore();
  const [activeTab, setActiveTab] = useState<'timer' | 'insights'>('timer');

  useEffect(() => {
    // Load saved state when popup opens
    loadFromStorage();

    // Listen for storage changes from background script
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.timerState) {
        const newState = changes.timerState.newValue;
        useTimerStore.setState(newState);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadFromStorage]);

  // Update document title with remaining time
  useEffect(() => {
    if (status === 'running') {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - Pomodoro`;
    } else {
      document.title = 'Pomodoro Timer';
    }
  }, [timeRemaining, status]);

  return (
    <div className="w-[400px] min-h-[500px] bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            🍅 Pomodoro Timer
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'timer'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ⏱️ 計時器
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            🤖 AI 洞察
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'timer' ? (
        <>
          <Timer />
          <Controls />
          <Stats />
        </>
      ) : (
        <AIInsights />
      )}
    </div>
  );
}

export default App;
