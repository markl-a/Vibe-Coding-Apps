# Reading Mode Pro

一個功能強大的閱讀模式瀏覽器擴展，提供無干擾的閱讀體驗。

## 功能特色

- **無干擾閱讀模式**：自動移除廣告、側邊欄和其他干擾元素
- **可自訂字體**：支援多種字體和字體大小調整
- **主題切換**：提供淺色、深色和棕褐色主題
- **文字轉語音**：內建 TTS 功能，可朗讀文章內容
- **閱讀進度追蹤**：記錄閱讀位置和進度
- **鍵盤快捷鍵**：使用鍵盤快速控制閱讀模式

## 安裝方式

### Chrome/Edge
1. 打開 `chrome://extensions/`
2. 啟用「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇此目錄

### Firefox
1. 打開 `about:debugging#/runtime/this-firefox`
2. 點擊「載入暫時附加元件」
3. 選擇 `manifest.json` 文件

## 使用說明

1. 點擊瀏覽器工具列上的擴展圖示
2. 點擊「啟用閱讀模式」按鈕
3. 使用設定面板自訂閱讀體驗

### 鍵盤快捷鍵

- `Alt+R` - 切換閱讀模式
- `Alt+T` - 切換主題
- `Alt+S` - 開始/停止 TTS 朗讀
- `+/-` - 調整字體大小

## 技術架構

- Manifest V3
- Vanilla JavaScript (無框架依賴)
- CSS Grid/Flexbox 佈局
- Web Speech API (TTS)
- Chrome Storage API

## 開發

```bash
npm install
npm run build
```

## 授權

MIT License
