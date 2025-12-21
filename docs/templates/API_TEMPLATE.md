# [API 名稱] 文檔

## 概述
[簡要描述此 API 的用途]

## 基礎 URL
```
https://api.example.com/v1
```

## 認證
所有請求需要在 Header 中包含：
```
Authorization: Bearer <token>
```

## 端點列表

### 獲取資源列表
```http
GET /resources
```

**請求參數:**
| 參數 | 類型 | 必需 | 說明 |
|------|------|------|------|
| page | number | 否 | 頁碼，默認 1 |
| limit | number | 否 | 每頁數量，默認 20 |

**響應示例:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## 錯誤碼
| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| VALIDATION_ERROR | 400 | 請求參數驗證失敗 |
| AUTHENTICATION_ERROR | 401 | 認證失敗 |
| AUTHORIZATION_ERROR | 403 | 無權限 |
| NOT_FOUND | 404 | 資源不存在 |
