import React, { useState, useEffect } from 'react';
import { Search, Copy, Trash2, Bookmark } from 'lucide-react';
import { TabItem } from '../components/TabItem';
import { getAllTabs, closeTab, switchToTab, findDuplicateTabs } from '../utils/tabUtils';

function App() {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    loadTabs();
    checkDuplicates();
  }, []);

  const loadTabs = async () => {
    const allTabs = await getAllTabs('current');
    setTabs(allTabs);
  };

  const checkDuplicates = async () => {
    const duplicates = await findDuplicateTabs();
    let count = 0;
    duplicates.forEach(tabList => {
      count += tabList.length - 1; // Count extras, not total
    });
    setDuplicateCount(count);
  };

  const filteredTabs = tabs.filter(tab => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tab.title?.toLowerCase().includes(query) ||
      tab.url?.toLowerCase().includes(query)
    );
  });

  const handleTabClick = async (tabId: number) => {
    await switchToTab(tabId);
    window.close();
  };

  const handleTabClose = async (tabId: number) => {
    await closeTab(tabId);
    await loadTabs();
    await checkDuplicates();
  };

  const handleCloseDuplicates = async () => {
    const duplicates = await findDuplicateTabs();
    for (const [url, tabList] of duplicates) {
      const tabsToClose = tabList.slice(1); // Keep first, close rest
      for (const tab of tabsToClose) {
        if (tab.id) {
          await closeTab(tab.id);
        }
      }
    }
    await loadTabs();
    await checkDuplicates();
  };

  return (
    <div className="w-[600px] h-[500px] bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
        <h1 className="text-2xl font-bold mb-2">📑 Tab Manager</h1>
        <div className="text-sm opacity-90">
          {tabs.length} tabs open
          {duplicateCount > 0 && ` • ${duplicateCount} duplicates`}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tabs by title or URL..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400"
            autoFocus
          />
        </div>
      </div>

      {/* Quick Actions */}
      {duplicateCount > 0 && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <button
            onClick={handleCloseDuplicates}
            className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200 hover:underline"
          >
            <Copy size={16} />
            Close {duplicateCount} duplicate tabs
          </button>
        </div>
      )}

      {/* Tab List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredTabs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tabs found
          </div>
        ) : (
          filteredTabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              onClick={() => tab.id && handleTabClick(tab.id)}
              onClose={() => tab.id && handleTabClose(tab.id)}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTabs.length} of {tabs.length} tabs
      </div>
    </div>
  );
}

export default App;
