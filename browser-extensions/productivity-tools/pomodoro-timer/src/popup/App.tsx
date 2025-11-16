import React, { useEffect } from 'react';
import { Timer } from '../components/Timer';
import { Controls } from '../components/Controls';
import { Stats } from '../components/Stats';
import { useTimerStore } from '../store/timerStore';

function App() {
  const { loadFromStorage, timeRemaining, status } = useTimerStore();

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
      <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          🍅 Pomodoro Timer
        </h1>
      </div>

      <Timer />
      <Controls />
      <Stats />
    </div>
  );
}

export default App;
