# 屏幕錄製工具 (Video Recorder)

基於 Electron 的跨平台屏幕錄製應用，支持全屏、窗口和區域錄製。

## 功能特色

- 📹 **多種錄製模式**
  - 全屏錄製
  - 窗口錄製
  - 自定義區域錄製

- 🎬 **專業功能**
  - 支持音頻錄製（系統音頻 + 麥克風）
  - 實時預覽
  - 暫停/繼續錄製
  - 自定義幀率和質量設置

- 💾 **靈活的輸出**
  - 支持 WebM、MP4 格式
  - 可自定義保存路徑
  - 自動生成文件名（含時間戳）

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

1. **選擇錄製模式**：點擊「全屏錄製」、「窗口錄製」或「區域錄製」
2. **配置設置**：調整音頻、質量等設置
3. **開始錄製**：點擊「開始錄製」按鈕
4. **控制錄製**：使用暫停/繼續、停止按鈕控制錄製過程
5. **保存視頻**：錄製完成後，視頻將自動保存到指定目錄

## 快捷鍵

- `Ctrl/Cmd + R`: 開始/停止錄製
- `Ctrl/Cmd + P`: 暫停/繼續錄製
- `Ctrl/Cmd + S`: 打開設置

## 技術棧

- Electron
- Web MediaRecorder API
- Electron desktopCapturer API
- HTML5 Canvas

## 系統要求

- Windows 10+ / macOS 10.13+ / Linux (主流發行版)
- 至少 4GB RAM
- 支持硬件加速的顯卡（推薦）

## 授權

MIT License
