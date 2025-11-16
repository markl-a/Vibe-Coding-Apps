import React, { useState, useEffect } from 'react';
import { Shield, Settings, BarChart3 } from 'lucide-react';
import { BlockListComponent } from '../components/BlockList';
import { BlockList, BlockerSettings, DEFAULT_SETTINGS } from '../types/blocker';

type TabType = 'blocklists' | 'settings' | 'stats';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('blocklists');
  const [blockLists, setBlockLists] = useState<BlockList[]>([]);
  const [settings, setSettings] = useState<BlockerSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState({
    totalBlocks: 0,
    blocksToday: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await chrome.storage.local.get(['blockLists', 'blockerSettings', 'blockerStats']);

    if (result.blockLists) {
      setBlockLists(result.blockLists);
    }

    if (result.blockerSettings) {
      setSettings(result.blockerSettings);
    }

    if (result.blockerStats) {
      setStats(result.blockerStats);
    }
  };

  const toggleList = async (id: string) => {
    const updated = blockLists.map((list) =>
      list.id === id ? { ...list, enabled: !list.enabled } : list
    );
    setBlockLists(updated);
    await chrome.storage.local.set({ blockLists: updated });
  };

  const removeSite = async (listId: string, site: string) => {
    const updated = blockLists.map((list) =>
      list.id === listId
        ? { ...list, sites: list.sites.filter((s) => s !== site) }
        : list
    );
    setBlockLists(updated);
    await chrome.storage.local.set({ blockLists: updated });
  };

  const addSite = async (listId: string, site: string) => {
    const updated = blockLists.map((list) =>
      list.id === listId
        ? { ...list, sites: [...list.sites, site] }
        : list
    );
    setBlockLists(updated);
    await chrome.storage.local.set({ blockLists: updated });
  };

  const toggleMainSwitch = async () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    await chrome.storage.local.set({ blockerSettings: updated });
  };

  return (
    <div className="w-[500px] min-h-[600px] bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={28} />
            Website Blocker
          </h1>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.enabled}
              onChange={toggleMainSwitch}
            />
            <div className="w-14 h-7 bg-white/30 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
          </label>
        </div>

        <div className="text-sm opacity-90">
          {settings.enabled ? 'Blocking enabled' : 'Blocking disabled'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('blocklists')}
          className={`flex-1 px-4 py-3 font-medium ${
            activeTab === 'blocklists'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Block Lists
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === 'stats'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <BarChart3 size={18} />
          Statistics
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '450px' }}>
        {activeTab === 'blocklists' && (
          <div className="space-y-3">
            {blockLists.map((list) => (
              <BlockListComponent
                key={list.id}
                list={list}
                onToggle={toggleList}
                onRemoveSite={removeSite}
                onAddSite={addSite}
              />
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.blocksToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Today
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalBlocks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.floor(stats.timeSaved / 60)}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Saved
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Quick Stats
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>📊 You've avoided {stats.totalBlocks} distractions</p>
                <p>⏰ Estimated {Math.floor(stats.timeSaved / 60)} hours saved</p>
                <p>🎯 Keep up the great focus!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
