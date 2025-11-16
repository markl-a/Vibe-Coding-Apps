# 🔐 編碼工具

全方位的編碼轉換工具，支援 Base64、URL、Hash、HTML、UUID 和 JWT 解碼。

## ✨ 功能特色

- ✅ **Base64** - 編碼和解碼
- ✅ **URL 編碼** - URL encode/decode
- ✅ **Hash 產生器** - MD5, SHA-1, SHA-256, SHA-512
- ✅ **HTML 實體** - HTML 字元編碼/解碼
- ✅ **UUID/GUID** - 產生 UUID v4 和簡單 GUID
- ✅ **JWT 解碼器** - 解析 JWT Token

## 🚀 快速開始

在瀏覽器中開啟 `index.html` 即可使用。

## 📋 工具說明

### 1. Base64 編碼/解碼

**用途:**
- 編碼二進位資料為文字
- 在 URL 或 Email 中傳輸資料
- 資料儲存和傳輸

**使用方法:**
1. 在左側輸入文字
2. 點擊「編碼」或「解碼」
3. 結果顯示在右側

**範例:**
```
輸入: Hello World
Base64: SGVsbG8gV29ybGQ=
```

### 2. URL 編碼/解碼

**用途:**
- URL 參數編碼
- 處理特殊字元
- API 請求準備

**使用方法:**
1. 輸入 URL 或文字
2. 點擊「編碼」或「解碼」
3. 複製結果

**範例:**
```
輸入: https://example.com?name=測試
編碼: https://example.com?name=%E6%B8%AC%E8%A9%A6
```

### 3. Hash 產生器

**支援的 Hash 算法:**
- **MD5** - 128-bit hash (不建議用於安全)
- **SHA-1** - 160-bit hash
- **SHA-256** - 256-bit hash (推薦)
- **SHA-512** - 512-bit hash (高安全性)

**用途:**
- 密碼 hash
- 檔案完整性驗證
- 資料指紋
- 快取鍵產生

**使用方法:**
1. 輸入文字
2. 點擊「產生 Hash 值」
3. 一次產生所有 Hash
4. 點擊複製按鈕複製特定 Hash

**範例:**
```
輸入: Hello World
MD5: b10a8db164e0754105b7a99be72e3fe5
SHA-256: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
```

### 4. HTML 實體編碼/解碼

**用途:**
- 防止 XSS 攻擊
- 顯示 HTML 原始碼
- 處理特殊字元

**使用方法:**
1. 輸入 HTML 文字
2. 點擊「編碼」或「解碼」
3. 複製結果

**範例:**
```
輸入: <div>Hello & "World"</div>
編碼: &lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;
```

### 5. UUID/GUID 產生器

**UUID 版本:**
- **UUID v4** - 隨機產生（RFC 4122 標準）
- **Simple GUID** - 簡單的隨機 GUID

**用途:**
- 唯一識別碼
- 資料庫主鍵
- 檔案命名
- API 請求 ID

**使用方法:**
1. 選擇 UUID 版本
2. 輸入要產生的數量
3. 點擊「產生 UUID」
4. 點擊複製按鈕複製特定 UUID

**範例:**
```
UUID v4: 550e8400-e29b-41d4-a716-446655440000
Simple GUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 6. JWT 解碼器

**功能:**
- 解析 JWT Token 結構
- 顯示 Header 和 Payload
- 不驗證簽名（僅解碼）

**用途:**
- 調試 JWT Token
- 查看 Token 內容
- 驗證 Token 格式

**使用方法:**
1. 貼上 JWT Token
2. 點擊「解碼 JWT」
3. 查看 Header 和 Payload

**注意事項:**
- 此工具僅解碼 JWT，不驗證簽名
- 不應信任未驗證的 Token
- 敏感資訊不應放入 JWT Payload

**JWT 結構:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header: {"alg":"HS256","typ":"JWT"}
Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
Signature: (需要密鑰驗證)
```

## 💡 使用技巧

### 技巧 1: 快捷操作
- 使用「📋 貼上」按鈕快速從剪貼簿貼上
- 使用「📄 複製」按鈕快速複製結果
- 使用「💾 下載」按鈕將結果儲存為檔案

### 技巧 2: 批次產生 UUID
一次產生多個 UUID，方便測試和開發：
```
數量: 10
一次產生 10 個唯一的 UUID
```

### 技巧 3: Hash 比較
產生相同文字的不同 Hash，比較安全性：
```
MD5: 快速但不安全
SHA-256: 平衡速度和安全性（推薦）
SHA-512: 最高安全性
```

### 技巧 4: URL 參數編碼
處理含中文或特殊字元的 URL：
```
原始: https://example.com?q=測試&lang=zh-TW
編碼: https://example.com?q=%E6%B8%AC%E8%A9%A6&lang=zh-TW
```

## 🔒 安全性考量

### Base64
- ⚠️ Base64 是編碼，**不是加密**
- 不應用於敏感資料保護
- 僅用於資料傳輸格式轉換

### Hash
- ✅ 使用 SHA-256 或更高等級
- ❌ 避免使用 MD5（已被破解）
- ❌ Hash 不可逆，無法解密

### JWT
- ⚠️ JWT Payload 是可解碼的
- 不應在 Payload 中放敏感資料
- 必須驗證簽名才能信任

## 🔧 技術細節

- 純 HTML/CSS/JavaScript
- 使用 Web Crypto API (SHA hash)
- 使用原生 btoa/atob (Base64)
- 使用 encodeURIComponent (URL)

## 📄 授權

MIT License
