# Privacy Guardian - 子專案說明

這個資料夾包含了 **Privacy Guardian** 瀏覽器擴展的實際可用子專案。

## 📂 子專案結構

### 1. **密碼管理器** (Password Manager)
**位置:** `src/services/password-service.ts`

**功能:**
- 安全儲存密碼（AES-256-GCM 加密）
- 密碼生成器（可自訂長度和字元類型）
- 密碼強度評估
- 密碼洩漏檢測（Have I Been Pwned API）
- 自動填寫登入表單

**使用方式:**
```typescript
import { PasswordService } from './services/password-service';

// 儲存密碼
await PasswordService.savePassword({
  domain: 'example.com',
  url: 'https://example.com/login',
  username: 'user@example.com',
  password: 'secretPassword123'
}, masterPassword);

// 生成強密碼
const password = PasswordService.generatePassword({
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
});
```

### 2. **Cookie 管理器** (Cookie Manager)
**位置:** `src/services/cookie-service.ts`

**功能:**
- 查看所有 Cookie
- 清除 Cookie（支援白名單）
- Cookie 分析和統計
- 第三方 Cookie 攔截
- Cookie 匯出功能

**使用方式:**
```typescript
import { CookieService } from './services/cookie-service';

// 取得所有 Cookie
const cookies = await CookieService.getAllCookies();

// 清除所有 Cookie（保留白名單）
const count = await CookieService.clearAllCookies(['google.com', 'github.com']);

// Cookie 分析
const analysis = await CookieService.analyzeCookies();
console.log(`總共 ${analysis.total} 個 Cookie`);
```

### 3. **追蹤器攔截器** (Tracker Blocker)
**位置:** `src/services/tracker-service.ts`, `src/background/service-worker.ts`

**功能:**
- 攔截已知追蹤器（Google Analytics、Facebook Pixel 等）
- 追蹤統計（已攔截數量、按域名分類）
- 自訂追蹤器列表
- 三種攔截級別（嚴格、中等、寬鬆）

**使用方式:**
```typescript
import { TrackerService } from './services/tracker-service';

// 檢查是否為追蹤器
if (TrackerService.isTracker(url)) {
  TrackerService.recordBlocked(url);
}

// 取得統計
const stats = await TrackerService.getStats();
console.log(`已攔截 ${stats.totalBlocked} 個追蹤器`);
```

### 4. **HTTPS 強制升級** (HTTPS Enforcer)
**位置:** `src/constants/rules.ts`, `src/background/service-worker.ts`

**功能:**
- 自動將 HTTP 請求升級為 HTTPS
- 使用 DeclarativeNetRequest API
- 不安全連線警告

**配置:**
規則在 `src/constants/rules.ts` 中定義，使用 Chrome 的 declarativeNetRequest API 自動重定向。

### 5. **隱私清理工具** (Privacy Cleaner)
**位置:** `src/services/privacy-service.ts`

**功能:**
- 清除瀏覽歷史
- 清除快取
- 清除下載記錄
- 清除表單資料
- 自動定時清理

**使用方式:**
```typescript
import { PrivacyService } from './services/privacy-service';

// 清除瀏覽歷史（最近 24 小時）
await PrivacyService.clearHistory({
  since: Date.now() - 24 * 60 * 60 * 1000
});

// 清除所有瀏覽資料
await PrivacyService.clearAll();

// 設定自動清理
await PrivacyService.setAutoCleanSettings({
  enabled: true,
  interval: 'daily',
  dataTypes: ['cache', 'history']
});
```

### 6. **表單偵測器** (Form Detector)
**位置:** `src/content/form-detector.ts`

**功能:**
- 自動偵測登入表單
- 在密碼欄位旁顯示填寫按鈕
- 自動填寫使用者名稱和密碼
- 支援多帳號選擇

**工作原理:**
作為 Content Script 注入到網頁中，監聽 DOM 變化並偵測表單。

## 🚀 快速開始

### 安裝依賴
```bash
cd browser-extensions/privacy-guardian
npm install
```

### 開發模式
```bash
npm run dev
```

然後在 Chrome 中載入擴展：
1. 開啟 `chrome://extensions/`
2. 啟用「開發者模式」
3. 點擊「載入未封裝項目」
4. 選擇 `privacy-guardian` 資料夾

### 建置生產版本
```bash
npm run build
```

建置輸出在 `dist/` 資料夾。

## 🔧 技術細節

### 加密技術
- **演算法:** AES-256-GCM
- **金鑰衍生:** PBKDF2 (100,000 次迭代)
- **密碼雜湊:** SHA-256
- **隨機數生成:** Web Crypto API

### 資料儲存
- **本地儲存:** Chrome Storage Local API
- **同步儲存:** Chrome Storage Sync API (可選)
- **加密儲存:** 所有敏感資料都經過加密

### API 使用
- `chrome.storage` - 資料儲存
- `chrome.cookies` - Cookie 管理
- `chrome.webRequest` - 網路請求攔截
- `chrome.declarativeNetRequest` - 宣告式網路規則
- `chrome.browsingData` - 瀏覽資料清理
- `chrome.privacy` - 隱私設定

## 📊 專案統計

- **服務模組:** 6 個
- **工具函數:** 4 個
- **UI 組件:** 2 個（Popup + Options）
- **背景服務:** 1 個
- **Content Scripts:** 1 個
- **總代碼行數:** ~3000+ 行

## 🔒 安全性

### 已實現的安全措施
✅ AES-256-GCM 加密
✅ PBKDF2 金鑰衍生（100,000 次迭代）
✅ 隨機鹽值和 IV
✅ 零知識架構（主密碼不儲存）
✅ k-Anonymity 模型（密碼洩漏檢測）

### 安全最佳實踐
- 敏感資料不以明文儲存
- 使用 Web Crypto API（瀏覽器原生加密）
- 最小權限原則
- 定期安全審計建議

## 🧪 測試

```bash
npm test
```

## 📝 程式碼品質

```bash
# 代碼檢查
npm run lint

# 格式化
npm run format
```

## 🤝 貢獻

歡迎提交 Pull Request！特別需要：
- 安全專家審查
- 更多追蹤器規則
- UI/UX 改進
- 單元測試

## 📄 授權

MIT License

---

**子專案狀態:** ✅ 完整實現
**最後更新:** 2025-11-16
**版本:** 1.0.0
