# 音頻錄製工具 (Audio Recorder)

基於 Electron 的跨平台音頻錄製與編輯應用，支持多種音頻格式和實時波形顯示。

## 功能特色

- 🎤 **專業錄音**
  - 高質量音頻錄製（最高 192kHz / 24-bit）
  - 支持多種音頻源（麥克風、系統音頻）
  - 實時音量監控和波形顯示
  - 降噪和回聲消除

- 🎵 **音頻編輯**
  - 剪切、複製、粘貼音頻片段
  - 音量調整和淡入淡出效果
  - 多段音頻合併
  - 靜音檢測和移除

- 💾 **格式支持**
  - WAV（無損）
  - MP3（壓縮）
  - OGG Vorbis
  - WebM Audio

- 📊 **可視化**
  - 實時波形圖
  - 頻譜分析器
  - 音量計

## 安裝依賴

```bash
npm install
```

## 運行應用

```bash
npm start
```

## 開發模式

```bash
npm run dev
```

## 打包應用

```bash
# 打包所有平台
npm run build

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 使用說明

1. **選擇音頻源**：在設置面板中選擇麥克風或系統音頻
2. **調整設置**：配置採樣率、比特率和音頻質量
3. **開始錄製**：點擊紅色錄音按鈕開始錄製
4. **監控音頻**：通過波形圖和音量計監控錄音質量
5. **編輯音頻**：使用編輯工具裁剪和調整錄音
6. **保存文件**：選擇格式並保存音頻文件

## 快捷鍵

- `Ctrl/Cmd + R`: 開始/停止錄製
- `Ctrl/Cmd + P`: 播放/暫停
- `Ctrl/Cmd + S`: 保存錄音
- `Space`: 播放/暫停（焦點在播放器時）
- `Ctrl/Cmd + Z`: 撤銷
- `Ctrl/Cmd + Shift + Z`: 重做

## 技術棧

- Electron
- Web Audio API
- MediaRecorder API
- Canvas (波形可視化)
- Web Workers (音頻處理)

## 系統要求

- Windows 10+ / macOS 10.13+ / Linux (主流發行版)
- 至少 2GB RAM
- 麥克風或音頻輸入設備

## 授權

MIT License
