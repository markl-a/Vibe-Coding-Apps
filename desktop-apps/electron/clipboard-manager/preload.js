const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 取得剪貼簿歷史
  getHistory: () => ipcRenderer.invoke('get-history'),

  // 複製到剪貼簿
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),

  // 刪除項目
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),

  // 切換收藏
  toggleFavorite: (id) => ipcRenderer.invoke('toggle-favorite', id),

  // 清除歷史記錄
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // 搜尋歷史記錄
  searchHistory: (query) => ipcRenderer.invoke('search-history', query),

  // 取得設定
  getConfig: () => ipcRenderer.invoke('get-config'),

  // 儲存設定
  setConfig: (config) => ipcRenderer.invoke('set-config', config),

  // 監聽歷史記錄更新
  onHistoryUpdated: (callback) => {
    ipcRenderer.on('history-updated', (event, history) => callback(history));
  }
});
