# 驗證工具快速參考

## 🚀 快速導入

```typescript
import {
  // XSS 和消毒
  sanitizeXSS,
  sanitizeHTML,
  sanitizeUserInput,
  stripHTML,
  sanitizeFilename,
  sanitizeURL,
  sanitizeJSON,

  // SQL 注入防護
  hasSQLInjection,
  sanitizeSQL,

  // 驗證器
  isEmail,
  isURL,
  isPhoneNumber,
  validatePassword,
  isUUID,
  isCreditCard,
  isIPAddress,
  isDate,
  isHexColor,
  isPort,
  isBase64,
  isJWT,
  isMongoId,

  // 數字驗證
  isInteger,
  isPositive,
  isInRange,

  // 字符串驗證
  isAlphanumeric,
  isNumeric,
  hasLength,
  isUsername,
  isSlug,

  // Zod Schemas (需要安裝 zod)
  emailSchema,
  passwordSchema,
  userRegistrationSchema,
  paginationSchema
} from '@vibe/shared-utils';
```

## 📋 常用功能速查表

### 1. 用戶輸入消毒

| 函數 | 用途 | 示例 |
|------|------|------|
| `sanitizeXSS(input)` | 完全移除 HTML，編碼特殊字符 | `sanitizeXSS('<script>alert(1)</script>')` |
| `sanitizeHTML(html, options)` | 保留安全的 HTML 標籤 | `sanitizeHTML('<p>Safe</p><script>Bad</script>')` |
| `sanitizeUserInput(input, options)` | 綜合消毒策略 | `sanitizeUserInput(input, {allowHTML: false})` |
| `stripHTML(html)` | 移除所有 HTML 標籤 | `stripHTML('<div>Text</div>')` → `'Text'` |

### 2. 安全檢查

| 函數 | 用途 | 示例 |
|------|------|------|
| `hasSQLInjection(input)` | 檢測 SQL 注入嘗試 | `hasSQLInjection("admin' OR '1'='1")` → `true` |
| `sanitizeSQL(input)` | 轉義 SQL 字符 | `sanitizeSQL("user'input")` → `"user''input"` |
| `sanitizeFilename(filename)` | 防止目錄遍歷 | `sanitizeFilename('../../../passwd')` |
| `sanitizeURL(url, domains)` | 驗證並清理 URL | `sanitizeURL('javascript:alert(1)')` → `''` |

### 3. 格式驗證

| 函數 | 用途 | 示例 |
|------|------|------|
| `isEmail(email)` | 驗證 email | `isEmail('user@example.com')` → `true` |
| `isURL(url)` | 驗證 URL | `isURL('https://example.com')` → `true` |
| `isPhoneNumber(phone, region)` | 驗證電話 | `isPhoneNumber('0912345678', 'TW')` → `true` |
| `isUUID(uuid)` | 驗證 UUID | `isUUID('550e8400-e29b-41d4-a716...')` → `true` |
| `isCreditCard(card)` | 驗證信用卡 (Luhn) | `isCreditCard('4532015112830366')` → `true` |
| `isIPAddress(ip, version)` | 驗證 IP 地址 | `isIPAddress('192.168.1.1', 4)` → `true` |

### 4. 密碼驗證

```typescript
const result = validatePassword('MyP@ssw0rd123', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
});

// result.isValid: boolean
// result.score: 0-5
// result.strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
// result.feedback: string[]
```

### 5. 常用配置示例

#### sanitizeHTML 配置
```typescript
sanitizeHTML(html, {
  allowedTags: ['p', 'br', 'strong', 'em', 'a'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  allowedProtocols: ['http', 'https'],
  allowDataAttributes: true
});
```

#### sanitizeUserInput 配置
```typescript
sanitizeUserInput(input, {
  allowHTML: false,        // 是否允許 HTML
  maxLength: 1000,         // 最大長度
  stripWhitespace: true    // 移除首尾空格
});
```

#### validatePassword 配置
```typescript
validatePassword(password, {
  minLength: 8,              // 最小長度
  requireUppercase: true,    // 需要大寫
  requireLowercase: true,    // 需要小寫
  requireNumbers: true,      // 需要數字
  requireSpecialChars: true, // 需要特殊字符
  minScore: 3                // 最小評分 (0-5)
});
```

## 🎯 常見場景

### 場景 1: 處理用戶評論

```typescript
import { sanitizeHTML, isEmail } from '@vibe/shared-utils';

function processComment(data) {
  return {
    author: sanitizeUserInput(data.author, { allowHTML: false, maxLength: 100 }),
    email: isEmail(data.email) ? data.email.toLowerCase() : null,
    content: sanitizeHTML(data.content, {
      allowedTags: ['p', 'br', 'strong', 'em'],
      allowedAttributes: {}
    })
  };
}
```

### 場景 2: 用戶註冊驗證

```typescript
import { isEmail, validatePassword, isPhoneNumber } from '@vibe/shared-utils';

function validateRegistration(data) {
  const errors = {};

  if (!isEmail(data.email)) {
    errors.email = 'Invalid email';
  }

  const pwdResult = validatePassword(data.password);
  if (!pwdResult.isValid) {
    errors.password = pwdResult.feedback.join(', ');
  }

  if (data.phone && !isPhoneNumber(data.phone, 'TW')) {
    errors.phone = 'Invalid phone number';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

### 場景 3: API 輸入過濾

```typescript
import { sanitizeUserInput, hasSQLInjection } from '@vibe/shared-utils';

function sanitizeAPIInput(data) {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // 檢測 SQL 注入
      if (hasSQLInjection(value)) {
        throw new Error(`Invalid input in field: ${key}`);
      }

      // 消毒
      sanitized[key] = sanitizeUserInput(value, {
        allowHTML: false,
        maxLength: 5000
      });
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
```

### 場景 4: 文件上傳驗證

```typescript
import { sanitizeFilename, hasExtension, isMimeType } from '@vibe/shared-utils';

function validateFileUpload(file) {
  // 安全的文件名
  const filename = sanitizeFilename(file.name);

  // 驗證擴展名
  const allowedExtensions = ['jpg', 'png', 'pdf'];
  if (!hasExtension(filename, allowedExtensions)) {
    throw new Error('File type not allowed');
  }

  // 驗證 MIME 類型
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new Error('Invalid mime type');
  }

  // 驗證大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large');
  }

  return { filename, valid: true };
}
```

### 場景 5: Express 中間件

```typescript
import { sanitizeUserInput, hasSQLInjection } from '@vibe/shared-utils';

function createSanitizationMiddleware() {
  return (req, res, next) => {
    // 消毒 query 參數
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeUserInput(value, { maxLength: 500 });
        }
      }
    }

    // 消毒和檢查 body
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          if (hasSQLInjection(value)) {
            return res.status(400).json({
              error: 'Invalid input detected',
              field: key
            });
          }
          req.body[key] = sanitizeUserInput(value, { maxLength: 10000 });
        }
      }
    }

    next();
  };
}

// 使用
app.use(createSanitizationMiddleware());
```

## 🔥 高頻使用函數 TOP 10

1. `sanitizeUserInput()` - 通用輸入消毒
2. `isEmail()` - Email 驗證
3. `validatePassword()` - 密碼強度檢查
4. `sanitizeHTML()` - HTML 內容清理
5. `hasSQLInjection()` - SQL 注入檢測
6. `isPhoneNumber()` - 電話驗證
7. `sanitizeFilename()` - 文件名安全處理
8. `isURL()` - URL 驗證
9. `isUUID()` - UUID 驗證
10. `sanitizeXSS()` - XSS 防護

## 💡 最佳實踐提示

### ✅ DO
- 總是在服務端驗證輸入
- 對所有用戶輸入進行消毒
- 使用白名單而不是黑名單
- 結合多種驗證方法
- 記錄可疑的驗證失敗

### ❌ DON'T
- 不要只依賴客戶端驗證
- 不要信任任何用戶輸入
- SQL 消毒不能替代參數化查詢
- 不要忽略文件上傳的安全檢查
- 不要在錯誤消息中暴露敏感信息

## 🔗 相關文檔

- [完整文檔](./src/validation/README.md)
- [工具總覽](./VALIDATION_TOOLS.md)
- [實際示例](./src/validation/examples.ts)
- [測試文件](./src/__tests__/validation-*.test.ts)

---

**提示**: 這是快速參考，詳細說明請查看完整文檔。
