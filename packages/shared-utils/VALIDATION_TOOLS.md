# 輸入驗證和消毒工具

已成功創建完整的輸入驗證和消毒工具庫，提供企業級安全防護。

## 📁 創建的文件

### 核心文件
1. **`src/validation/sanitize.ts`** (336行)
   - XSS 防護函數
   - SQL 注入防護
   - HTML 消毒和清理
   - 文件名安全處理
   - URL 消毒
   - JSON 防原型污染

2. **`src/validation/validators.ts`** (487行)
   - 30+ 個常用驗證器
   - Email、URL、電話號碼驗證
   - 密碼強度檢查（帶評分系統）
   - UUID、信用卡、IP地址驗證
   - 多種數據格式驗證

3. **`src/validation/schemas.ts`** (458行)
   - 40+ 個 Zod 驗證 schemas
   - 可重用的驗證模式
   - 類型推導支持
   - Schema 組合工具

### 輔助文件
4. **`src/validation/index.ts`** - 統一導出
5. **`src/validation/README.md`** - 完整使用文檔（330行）
6. **`src/validation/examples.ts`** - 10個實際應用示例（370行）

### 測試文件
7. **`src/__tests__/validation-sanitize.test.ts`** - 消毒函數測試（250行）
8. **`src/__tests__/validation-validators.test.ts`** - 驗證器測試（370行）

## 🛡️ 主要功能

### 1. XSS 防護

```typescript
import { sanitizeXSS, sanitizeHTML, sanitizeUserInput } from '@vibe/shared-utils';

// 完全移除 HTML
const safe = sanitizeXSS('<script>alert("xss")</script>');
// 結果: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

// 保留安全的 HTML 標籤
const html = sanitizeHTML('<p>安全</p><script>危險</script>', {
  allowedTags: ['p', 'strong', 'em'],
  allowedAttributes: { 'a': ['href'] }
});

// 智能用戶輸入處理
const clean = sanitizeUserInput(input, {
  allowHTML: false,
  maxLength: 500,
  stripWhitespace: true
});
```

### 2. SQL 注入防護

```typescript
import { hasSQLInjection, sanitizeSQL } from '@vibe/shared-utils';

// 檢測 SQL 注入嘗試
if (hasSQLInjection("admin' OR '1'='1")) {
  // 阻止請求
}

// 基礎消毒（仍應使用參數化查詢！）
const escaped = sanitizeSQL("user'input");
// 結果: user''input
```

### 3. HTML 標籤過濾

```typescript
import { sanitizeHTML, stripHTML } from '@vibe/shared-utils';

// 允許特定標籤和屬性
const cleaned = sanitizeHTML(content, {
  allowedTags: ['h1', 'p', 'a', 'strong', 'em'],
  allowedAttributes: {
    'a': ['href', 'title', 'rel']
  },
  allowedProtocols: ['http', 'https']
});

// 完全移除所有 HTML
const text = stripHTML('<div><p>文字</p></div>');
// 結果: 文字
```

### 4. Email 驗證

```typescript
import { isEmail } from '@vibe/shared-utils';

isEmail('user@example.com');           // true
isEmail('john.doe+tag@example.co.uk'); // true
isEmail('invalid.email');              // false
```

### 5. 電話號碼驗證

```typescript
import { isPhoneNumber } from '@vibe/shared-utils';

// 台灣手機
isPhoneNumber('0912345678', 'TW');     // true
isPhoneNumber('+886912345678', 'TW');  // true

// 美國電話
isPhoneNumber('+1-555-123-4567', 'US'); // true

// 國際格式 (E.164)
isPhoneNumber('+886912345678');        // true
```

### 6. 密碼強度檢查

```typescript
import { validatePassword } from '@vibe/shared-utils';

const result = validatePassword('MyP@ssw0rd123', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minScore: 3
});

// result = {
//   isValid: true,
//   score: 5,
//   strength: 'very-strong',
//   feedback: ['Password meets all requirements']
// }
```

### 7. URL 驗證和消毒

```typescript
import { isURL, sanitizeURL } from '@vibe/shared-utils';

// 驗證 URL
isURL('https://example.com');                      // true
isURL('ftp://files.com', { protocols: ['ftp'] }); // true

// 消毒 URL（防止惡意重定向）
sanitizeURL('javascript:alert(1)');                // ''
sanitizeURL('https://evil.com', ['trusted.com']);  // ''
```

### 8. 其他驗證器

```typescript
import {
  isUUID,           // UUID 驗證
  isCreditCard,     // 信用卡（Luhn 算法）
  isIPAddress,      // IPv4/IPv6
  isDate,           // 日期驗證
  isISODate,        // ISO 8601 日期
  isHexColor,       // 十六進制顏色
  isPort,           // 端口號
  isBase64,         // Base64 字符串
  isJWT,            // JWT token
  isMongoId,        // MongoDB ObjectId
  isAlphanumeric,   // 字母數字
  isNumeric,        // 數字
  isInteger,        // 整數
  isPositive,       // 正數
  isInRange,        // 範圍檢查
  hasLength,        // 長度檢查
  isUsername,       // 用戶名
  isSlug,           // URL slug
  isMimeType,       // MIME 類型
  hasExtension      // 文件擴展名
} from '@vibe/shared-utils';

// UUID
isUUID('550e8400-e29b-41d4-a716-446655440000');     // true

// 信用卡
isCreditCard('4532015112830366');                    // true

// IP 地址
isIPAddress('192.168.1.1');                          // true (IPv4)
isIPAddress('2001:db8::1', 6);                       // true (IPv6)

// 十六進制顏色
isHexColor('#FF5733');                               // true

// 端口號
isPort(8080);                                        // true

// MongoDB ObjectId
isMongoId('507f1f77bcf86cd799439011');              // true
```

### 9. Zod Schemas (需安裝 zod)

```typescript
import {
  emailSchema,
  passwordSchema,
  userRegistrationSchema,
  paginationSchema,
  phoneSchema,
  urlSchema,
  uuidSchema
} from '@vibe/shared-utils';

// 單一驗證
const email = emailSchema.parse('user@example.com');

// 複雜對象驗證
const userData = userRegistrationSchema.parse({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'MyP@ssw0rd123',
  confirmPassword: 'MyP@ssw0rd123'
});

// 自動類型推導
import type { UserRegistration, Pagination } from '@vibe/shared-utils';
```

## 📦 安裝和使用

### 基礎功能（無需額外依賴）

```bash
# sanitize 和 validators 開箱即用
pnpm add @vibe/shared-utils
```

### 使用 Zod Schemas

```bash
# 安裝 zod
pnpm add zod

# 然後在 src/validation/index.ts 中取消註釋:
# export * from './schemas';
```

## 🎯 實際應用示例

### Express 中間件

```typescript
import { sanitizeUserInput, hasSQLInjection } from '@vibe/shared-utils';

app.use((req, res, next) => {
  // 消毒所有輸入
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      // 檢測 SQL 注入
      if (hasSQLInjection(req.body[key])) {
        return res.status(400).json({ error: 'Invalid input' });
      }

      // 消毒輸入
      req.body[key] = sanitizeUserInput(req.body[key], {
        allowHTML: false,
        maxLength: 10000
      });
    }
  }
  next();
});
```

### React 表單驗證

```typescript
import { validatePassword, isEmail } from '@vibe/shared-utils';

function RegistrationForm() {
  const handleSubmit = (data) => {
    const errors = {};

    if (!isEmail(data.email)) {
      errors.email = 'Invalid email';
    }

    const pwdResult = validatePassword(data.password);
    if (!pwdResult.isValid) {
      errors.password = pwdResult.feedback.join(', ');
    }

    return errors;
  };
}
```

### 用戶註冊驗證

```typescript
import {
  sanitizeUserInput,
  isEmail,
  validatePassword,
  isPhoneNumber
} from '@vibe/shared-utils';

function validateRegistration(input) {
  const errors = {};

  // 消毒用戶名
  const username = sanitizeUserInput(input.username, {
    allowHTML: false,
    maxLength: 50,
    stripWhitespace: true
  });

  // 驗證 email
  if (!isEmail(input.email)) {
    errors.email = 'Invalid email format';
  }

  // 檢查密碼強度
  const pwdCheck = validatePassword(input.password, {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  });

  if (!pwdCheck.isValid) {
    errors.password = pwdCheck.feedback.join(', ');
  }

  // 驗證電話（台灣）
  if (input.phone && !isPhoneNumber(input.phone, 'TW')) {
    errors.phone = 'Invalid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: { username, email: input.email.toLowerCase() }
  };
}
```

### 文件上傳安全處理

```typescript
import { sanitizeFilename, hasExtension } from '@vibe/shared-utils';

function handleFileUpload(file) {
  // 防止目錄遍歷攻擊
  const safeFilename = sanitizeFilename(file.name);

  // 驗證文件類型
  const allowedTypes = ['jpg', 'png', 'pdf'];
  if (!hasExtension(safeFilename, allowedTypes)) {
    throw new Error('File type not allowed');
  }

  // 檢查文件大小
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large');
  }

  return { filename: safeFilename };
}
```

## 🔒 安全最佳實踐

1. **多層防護**: 結合多種驗證和消毒方法
2. **服務端驗證**: 永遠在服務端驗證，客戶端驗證僅用於用戶體驗
3. **參數化查詢**: SQL 消毒不能替代參數化查詢/ORM
4. **白名單方式**: 使用允許列表而非阻止列表
5. **限制輸入長度**: 防止 DoS 攻擊
6. **記錄異常**: 記錄所有驗證失敗和可疑輸入

## 📊 統計信息

- **總代碼行數**: ~2,600 行
- **測試覆蓋**: 620+ 測試行數
- **驗證器數量**: 30+ 個
- **Zod Schemas**: 40+ 個
- **實際示例**: 10 個完整場景
- **文檔頁數**: 500+ 行文檔

## 🚀 性能優化

- 所有正則表達式在模塊級別預編譯
- 避免重複編譯和內存分配
- 適合高頻 API 調用
- 零運行時依賴（除 Zod schemas）

## 📚 相關文檔

- [完整使用文檔](./src/validation/README.md)
- [實際應用示例](./src/validation/examples.ts)
- [測試文件](./src/__tests__/validation-*.test.ts)

## ⚡ 快速開始

```typescript
// 1. 導入需要的函數
import {
  sanitizeUserInput,
  isEmail,
  validatePassword,
  isPhoneNumber
} from '@vibe/shared-utils';

// 2. 使用驗證器
const email = 'user@example.com';
if (isEmail(email)) {
  console.log('Valid email!');
}

// 3. 消毒用戶輸入
const userInput = sanitizeUserInput('<script>alert(1)</script>Hello', {
  allowHTML: false
});

// 4. 檢查密碼強度
const pwdResult = validatePassword('MyP@ssw0rd123');
console.log(`Password strength: ${pwdResult.strength}`);
console.log(`Score: ${pwdResult.score}/5`);
```

## 🔧 維護和擴展

所有工具都設計為可擴展的：

- 添加新的驗證器很簡單
- 自定義 Zod schemas 易於組合
- 消毒選項可配置
- 支持自定義錯誤消息

## ✅ 已完成

- ✅ XSS 字符串清理
- ✅ SQL 注入防護
- ✅ HTML 標籤過濾
- ✅ Email/URL/電話驗證
- ✅ 密碼強度檢查（帶評分系統）
- ✅ 30+ 個常用驗證器
- ✅ 40+ 個 Zod schemas
- ✅ 完整測試套件
- ✅ 詳細文檔和示例
- ✅ TypeScript 類型支持

---

**創建時間**: 2025-12-21
**版本**: 1.0.0
**狀態**: ✅ 生產就緒
