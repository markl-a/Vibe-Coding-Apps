const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染程序
contextBridge.exposeInMainWorld('electronAPI', {
  // 檔案操作
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (currentPath) => ipcRenderer.invoke('save-file-dialog', currentPath),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // 匯出功能
  exportHtml: (html) => ipcRenderer.invoke('export-html', html),
  exportPdf: () => ipcRenderer.invoke('export-pdf'),

  // 設定管理
  getConfig: (key, defaultValue) => ipcRenderer.invoke('get-config', key, defaultValue),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // 最近檔案
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),

  // 選單事件監聽
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  onMenuSaveFileAs: (callback) => ipcRenderer.on('menu-save-file-as', callback),
  onMenuExportHtml: (callback) => ipcRenderer.on('menu-export-html', callback),
  onMenuExportPdf: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
  onMenuReplace: (callback) => ipcRenderer.on('menu-replace', callback),
  onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
  onMenuFormatBold: (callback) => ipcRenderer.on('menu-format-bold', callback),
  onMenuFormatItalic: (callback) => ipcRenderer.on('menu-format-italic', callback),
  onMenuFormatStrikethrough: (callback) => ipcRenderer.on('menu-format-strikethrough', callback),
  onMenuFormatH1: (callback) => ipcRenderer.on('menu-format-h1', callback),
  onMenuFormatH2: (callback) => ipcRenderer.on('menu-format-h2', callback),
  onMenuFormatH3: (callback) => ipcRenderer.on('menu-format-h3', callback),
  onMenuFormatLink: (callback) => ipcRenderer.on('menu-format-link', callback),
  onMenuFormatImage: (callback) => ipcRenderer.on('menu-format-image', callback),
  onMenuFormatCode: (callback) => ipcRenderer.on('menu-format-code', callback),
  onMenuHelpMarkdown: (callback) => ipcRenderer.on('menu-help-markdown', callback)
});
