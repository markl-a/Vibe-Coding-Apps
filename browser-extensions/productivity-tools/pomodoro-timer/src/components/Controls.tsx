import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTimerStore } from '../store/timerStore';

export const Controls: React.FC = () => {
  const { status, setStatus, resetTimer } = useTimerStore();

  const handleStart = () => {
    setStatus('running');
    chrome.runtime.sendMessage({ type: 'START_TIMER' });
  };

  const handlePause = () => {
    setStatus('paused');
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  };

  const handleReset = () => {
    resetTimer();
    chrome.runtime.sendMessage({ type: 'RESET_TIMER' });
  };

  return (
    <div className="flex items-center justify-center gap-4 px-8 pb-6">
      {status === 'running' ? (
        <button
          onClick={handlePause}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Pause size={20} />
          Pause
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Play size={20} />
          {status === 'paused' ? 'Resume' : 'Start'}
        </button>
      )}

      <button
        onClick={handleReset}
        className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
      >
        <RotateCcw size={20} />
        Reset
      </button>
    </div>
  );
};
