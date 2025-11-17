# HTTP Header Viewer 🔍

一個專業的 HTTP 標頭查看工具，幫助開發者檢查和分析任何網站的 HTTP 請求和回應標頭資訊。

## ✨ 功能特色

- **完整標頭資訊** - 查看所有 HTTP 回應和請求標頭
- **多種 HTTP 方法** - 支援 GET、POST、PUT、DELETE、HEAD、OPTIONS
- **安全性分析** - 自動檢測安全相關的 HTTP 標頭
- **狀態碼顯示** - 清楚顯示 HTTP 狀態碼和狀態文字
- **一鍵複製** - 快速複製任何標頭值
- **原始資料匯出** - JSON 格式查看完整資訊
- **快速測試** - 內建常用 API 端點快速測試
- **即時查詢** - 快速獲取最新的標頭資訊

## 🚀 使用方式

1. 在網址輸入框中輸入要查詢的網址
2. 選擇 HTTP 方法（GET、POST 等）
3. 點擊「查詢標頭」按鈕
4. 查看各個分頁的標頭資訊

### 快速測試

點擊快速測試按鈕，立即測試常用 API：
- GitHub API
- JSONPlaceholder
- HTTPBin
- Google

## 📊 標籤頁說明

### 回應標頭
顯示伺服器回傳的所有 HTTP 標頭，包括：
- Content-Type
- Cache-Control
- Server
- Date
- 等等...

### 請求標頭
顯示瀏覽器發送的請求標頭，包括：
- User-Agent
- Accept
- Accept-Language
- Connection
- Method

### 安全性標頭
專門顯示安全相關的標頭，包括：
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- CORS 相關標頭

如果網站缺少安全性標頭，工具會發出警告提示。

### 原始資料
以 JSON 格式顯示完整的回應資訊，方便複製和分析。

## 🎯 使用情境

### API 開發
- 檢查 API 回應標頭是否正確
- 驗證 CORS 設定
- 檢查快取策略

### 安全性測試
- 檢查網站是否實作安全標頭
- 驗證 CSP 設定
- 檢查 HTTPS 強制升級

### 效能優化
- 檢查快取標頭
- 查看壓縮設定
- 分析內容類型

### 除錯
- 排查 HTTP 狀態碼問題
- 檢查重定向
- 驗證標頭值

## ⚠️ 注意事項

### CORS 限制
由於瀏覽器的 CORS（跨來源資源共用）政策限制，某些網站可能無法直接查詢。如果遇到 CORS 錯誤，這是正常現象，表示目標網站不允許跨來源請求。

建議查詢以下類型的網址：
- 公開 API
- 設定 CORS 的網站
- 自己的網站

### 支援的 HTTP 方法
- **GET** - 獲取資源
- **POST** - 提交資料
- **PUT** - 更新資源
- **DELETE** - 刪除資源
- **HEAD** - 只獲取標頭
- **OPTIONS** - 獲取支援的方法

## 🛠️ 技術細節

- 純 JavaScript，無外部依賴
- 使用 Fetch API 發送請求
- 響應式設計，支援各種螢幕尺寸
- 暗色系開發者友善介面

## 🔒 隱私說明

本工具完全在瀏覽器端運行，不會：
- 儲存任何查詢記錄
- 上傳任何資料到伺服器
- 收集任何使用者資訊

## 📝 常見安全標頭說明

### Content-Security-Policy (CSP)
定義允許載入的內容來源，防止 XSS 攻擊

### Strict-Transport-Security (HSTS)
強制使用 HTTPS 連線

### X-Content-Type-Options
防止 MIME 類型嗅探攻擊

### X-Frame-Options
防止點擊劫持攻擊

### X-XSS-Protection
啟用瀏覽器的 XSS 過濾器

## 💡 開發建議

### 推薦的安全標頭設定

```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

## 📄 授權

MIT License

---

**讓 HTTP 標頭一目了然！** 🚀
