# 攝像頭捕捉工具 (Webcam Capture)

基於 Electron 的跨平台攝像頭拍照與錄像應用，支持多種濾鏡效果和實時預覽。

## 功能特色

- 📸 **拍照功能**
  - 高清照片拍攝（最高 4K）
  - 倒數計時拍照
  - 連拍模式
  - 自動保存和手動保存選項

- 🎥 **錄像功能**
  - 高質量視頻錄製
  - 支持多種分辨率（720p, 1080p, 4K）
  - 可調節幀率和比特率
  - 實時錄像時長顯示

- 🎨 **濾鏡效果**
  - 黑白濾鏡
  - 復古效果
  - 反色效果
  - 模糊效果
  - 銳化效果
  - 亮度/對比度調整

- 🖼️ **圖片管理**
  - 照片縮略圖預覽
  - 快速刪除和導出
  - 支持 JPG、PNG 格式
  - 批量操作

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

1. **選擇攝像頭**：在設置面板中選擇要使用的攝像頭
2. **調整設置**：配置分辨率、質量等參數
3. **應用濾鏡**：選擇喜歡的濾鏡效果
4. **拍照**：點擊拍照按鈕或使用倒數計時
5. **錄像**：點擊錄像按鈕開始錄製視頻
6. **管理文件**：在圖庫中查看、刪除或導出照片和視頻

## 快捷鍵

- `Space`: 拍照
- `Ctrl/Cmd + R`: 開始/停止錄像
- `Ctrl/Cmd + S`: 保存當前照片
- `Ctrl/Cmd + Delete`: 刪除選中的照片
- `F`: 切換全屏模式
- `數字 1-5`: 快速切換濾鏡

## 技術棧

- Electron
- Web MediaStream API
- Canvas API (圖像處理)
- HTML5 Video
- CSS Filters

## 系統要求

- Windows 10+ / macOS 10.13+ / Linux (主流發行版)
- 至少 2GB RAM
- 攝像頭設備
- 建議使用獨立顯卡（處理濾鏡效果）

## 授權

MIT License
