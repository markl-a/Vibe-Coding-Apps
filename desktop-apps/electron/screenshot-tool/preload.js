const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 截圖功能
  captureFullScreen: () => ipcRenderer.invoke('capture-fullscreen'),
  captureRegion: () => ipcRenderer.invoke('capture-region'),
  captureWindow: () => ipcRenderer.invoke('capture-window'),

  // 儲存和複製
  saveScreenshot: (dataUrl) => ipcRenderer.invoke('save-screenshot', dataUrl),
  copyToClipboard: (dataUrl) => ipcRenderer.invoke('copy-to-clipboard', dataUrl),

  // AI 功能
  recognizeText: (imageBase64) => ipcRenderer.invoke('ai-recognize-text', imageBase64),
  describeImage: (imageBase64) => ipcRenderer.invoke('ai-describe-image', imageBase64),
  translateText: (text, targetLang) => ipcRenderer.invoke('ai-translate-text', text, targetLang),

  // 設定管理
  getConfig: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // 歷史記錄
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // 事件監聽
  onStartRegionCapture: (callback) => ipcRenderer.on('start-region-capture', callback),
  onLoadImage: (callback) => ipcRenderer.on('load-image', callback),
  onShowSettings: (callback) => ipcRenderer.on('show-settings', callback)
});
