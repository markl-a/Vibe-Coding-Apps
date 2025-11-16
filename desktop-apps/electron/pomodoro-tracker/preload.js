const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  updateTray: (text) => ipcRenderer.invoke('update-tray', text),

  // 設定管理
  getConfig: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // 統計資料
  getStats: () => ipcRenderer.invoke('get-stats'),
  saveStats: (stats) => ipcRenderer.invoke('save-stats', stats),

  // 任務管理
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  saveTasks: (tasks) => ipcRenderer.invoke('save-tasks', tasks),

  // 托盤事件
  onTrayToggleTimer: (callback) => ipcRenderer.on('tray-toggle-timer', callback),
  onShowSettings: (callback) => ipcRenderer.on('show-settings', callback)
});
