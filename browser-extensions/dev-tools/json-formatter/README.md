# 📝 JSON 格式化工具

強大的 JSON 格式化、驗證和操作工具，支援多種實用功能。

## ✨ 功能特色

### 核心功能
- ✅ **格式化** - 美化 JSON，可自訂縮排（2/4/8 空格或 Tab）
- ✅ **壓縮** - 最小化 JSON 大小，移除所有空白
- ✅ **驗證** - 檢查 JSON 語法是否正確
- ✅ **轉義/反轉義** - JSON 字串轉義處理
- ✅ **排序** - 按鍵名稱排序（支援遞迴排序）
- ✅ **JSONPath 查詢** - 使用 JSONPath 語法查詢資料
- ✅ **即時格式化** - 輸入時自動格式化
- ✅ **範例 JSON** - 內建多種範例資料

### 便利功能
- 📋 剪貼簿貼上/複製
- 💾 下載為 JSON 檔案
- 📊 顯示字元數和行數
- ✓ 即時驗證狀態顯示
- 🎨 語法高亮（計畫中）

## 🚀 快速開始

1. 在瀏覽器中開啟 `index.html`
2. 在左側輸入或貼上 JSON 資料
3. 點擊相應的工具按鈕進行操作
4. 結果將顯示在右側

## 📋 詳細功能說明

### 1. 格式化 JSON

**功能說明:**
將壓縮或混亂的 JSON 資料格式化為易讀的格式。

**使用方法:**
1. 在左側輸入或貼上 JSON 資料
2. 點擊「✨ 格式化」按鈕
3. 右側會顯示格式化後的結果

**選項:**
- **縮排空格數** - 可選擇 2、4、8 空格或 Tab
- **格式化時自動排序** - 勾選後會同時按鍵排序

**範例:**

輸入:
```json
{"name":"John","age":30,"city":"Taipei","skills":["JavaScript","Python"]}
```

輸出:
```json
{
  "name": "John",
  "age": 30,
  "city": "Taipei",
  "skills": [
    "JavaScript",
    "Python"
  ]
}
```

### 2. 壓縮 JSON

**功能說明:**
移除所有不必要的空白字元，最小化 JSON 大小。

**使用場景:**
- 減少傳輸大小
- 減少儲存空間
- API 回應優化

**範例:**

輸入:
```json
{
  "name": "John",
  "age": 30
}
```

輸出:
```json
{"name":"John","age":30}
```

### 3. 驗證 JSON

**功能說明:**
檢查 JSON 語法是否正確，並提供詳細的錯誤訊息。

**錯誤提示包含:**
- 錯誤位置（行號和列號）
- 錯誤描述
- 修正建議

**常見錯誤:**
```json
// ❌ 多餘的逗號
{
  "name": "John",
  "age": 30,
}

// ❌ 單引號（應使用雙引號）
{
  'name': 'John'
}

// ❌ 鍵名沒有引號
{
  name: "John"
}

// ✅ 正確格式
{
  "name": "John",
  "age": 30
}
```

### 4. 轉義/反轉義

**轉義 (Escape):**
將 JSON 轉換為可嵌入字串中的格式。

範例:
```
輸入: {"name":"John"}
輸出: "{\"name\":\"John\"}"
```

**反轉義 (Unescape):**
將轉義的 JSON 字串還原為正常 JSON。

範例:
```
輸入: "{\"name\":\"John\"}"
輸出: {"name":"John"}
```

**使用場景:**
- API 回應中包含 JSON 字串
- 資料庫儲存的轉義 JSON
- 日誌檔案中的 JSON

### 5. 排序

**功能說明:**
按鍵名稱的字母順序排序 JSON 物件（包含巢狀物件）。

**範例:**

輸入:
```json
{
  "name": "John",
  "age": 30,
  "address": {
    "zip": "100",
    "city": "Taipei",
    "street": "Main St"
  }
}
```

輸出:
```json
{
  "address": {
    "city": "Taipei",
    "street": "Main St",
    "zip": "100"
  },
  "age": 30,
  "name": "John"
}
```

### 6. JSONPath 查詢

**功能說明:**
使用 JSONPath 語法查詢和提取 JSON 資料的特定部分。

**支援的語法:**
- `$` - 根物件
- `$.key` - 訪問鍵
- `$.*` - 所有值
- `$.key[0]` - 陣列元素
- `$..key` - 遞迴搜尋（基本支援）

**範例:**

JSON 資料:
```json
{
  "users": [
    {"name": "Alice", "age": 25},
    {"name": "Bob", "age": 30}
  ],
  "total": 2
}
```

查詢範例:
```
$.users[0].name     → "Alice"
$.users[1].age      → 30
$.total             → 2
$.users             → [{"name":"Alice","age":25},{"name":"Bob","age":30}]
$                   → 整個 JSON
```

## 🎯 使用範例

### 範例 1: API 回應格式化

假設你從 API 獲得壓縮的 JSON:

```json
{"status":"success","data":{"user":{"id":1,"name":"John","email":"john@example.com"},"posts":[{"id":1,"title":"Hello"},{"id":2,"title":"World"}]}}
```

使用格式化工具後:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John",
      "email": "john@example.com"
    },
    "posts": [
      {
        "id": 1,
        "title": "Hello"
      },
      {
        "id": 2,
        "title": "World"
      }
    ]
  }
}
```

### 範例 2: 提取特定資料

使用 JSONPath 查詢:
```
$.data.user.name    → "John"
$.data.posts[0]     → {"id":1,"title":"Hello"}
```

### 範例 3: 準備 API 請求

1. 輸入資料:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

2. 點擊「排序」確保鍵的順序一致
3. 點擊「壓縮」減少大小
4. 點擊「複製」複製到剪貼簿
5. 用於 API 請求

## ⚙️ 設定選項

### 縮排空格數
選擇格式化時的縮排方式:
- **2 空格** (預設) - 適合大多數情況
- **4 空格** - 更寬鬆的縮排
- **8 空格** - 超寬縮排
- **Tab** - 使用 Tab 字元

### 格式化時自動排序
勾選後，格式化時會自動按鍵名排序。

### 即時格式化
勾選後，輸入 JSON 時會自動即時格式化顯示結果。

## 💡 使用技巧

### 技巧 1: 快速驗證
貼上 JSON 後直接點擊「驗證」，快速檢查語法。

### 技巧 2: 組合使用
常用組合:
1. 格式化 + 排序 - 產生標準化的 JSON
2. 驗證 + 格式化 - 確保正確並美化
3. 格式化 + 壓縮 - 對比大小差異

### 技巧 3: 鍵盤快捷鍵
- `Ctrl+A` - 全選輸入
- `Ctrl+C` - 複製
- `Ctrl+V` - 貼上

### 技巧 4: 處理大型 JSON
對於大型 JSON:
1. 先驗證語法
2. 使用壓縮減少大小
3. 需要時再格式化查看特定部分

## 📚 內建範例

工具提供 4 個範例 JSON:

1. **簡單物件** - 基本的 JSON 物件結構
2. **陣列** - 包含陣列的 JSON
3. **巢狀結構** - 複雜的多層巢狀
4. **API 回應** - 典型的 API 回應格式

點擊範例卡片即可載入到編輯器。

## 🔧 技術細節

### 技術棧
- 純 HTML/CSS/JavaScript
- 原生 JSON.parse() 和 JSON.stringify()
- LocalStorage (未來功能)

### 檔案結構
```
json-formatter/
├── index.html      # 主頁面
├── styles.css      # 樣式表
├── script.js       # 應用邏輯
└── README.md       # 說明文件
```

### 效能
- 可處理數 MB 的 JSON 檔案
- 即時格式化建議用於小於 1MB 的 JSON
- 大型 JSON 建議關閉即時格式化

## 🐛 已知限制

- JSONPath 功能僅支援基本語法
- 不支援 JSON5 擴展語法
- 不支援 YAML 轉換
- 大型 JSON (>10MB) 可能較慢

## 🚀 未來功能

- [ ] 完整 JSONPath 支援
- [ ] JSON Schema 驗證
- [ ] JSON 轉 YAML/XML
- [ ] 差異比較
- [ ] 搜尋和高亮
- [ ] 樹狀結構顯示
- [ ] 批次處理
- [ ] 儲存常用 JSON

## 🔒 隱私與安全

- ✅ 所有操作完全在本地執行
- ✅ 不會上傳任何資料
- ✅ 不使用網路連線
- ✅ 不儲存任何資料（除非使用下載功能）

## 📄 授權

MIT License

---

**專業的 JSON 處理工具** 📝
