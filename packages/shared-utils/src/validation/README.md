# Validation and Sanitization Utilities

完整的輸入驗證和消毒工具庫，提供 XSS 防護、SQL 注入防護、HTML 消毒等安全功能。

## 安裝

```bash
# 基礎功能（sanitize 和 validators）無需額外依賴
# 如需使用 Zod schemas，請安裝：
pnpm add zod
```

安裝 Zod 後，在 `src/validation/index.ts` 中取消註釋：
```typescript
export * from './schemas';
```

## 功能模塊

### 1. Sanitize (sanitize.ts)
提供多種消毒和清理功能，防止安全漏洞。

### 2. Validators (validators.ts)
豐富的驗證器集合，支持各種常見數據格式。

### 3. Schemas (schemas.ts)
基於 Zod 的可重用驗證模式（需要安裝 zod）。

## 使用示例

### XSS 防護

```typescript
import { sanitizeXSS, sanitizeHTML, sanitizeUserInput } from '@vibe/shared-utils';

// 基礎 XSS 清理 - 移除所有 HTML
const userInput = '<script>alert("xss")</script>Hello';
const safe = sanitizeXSS(userInput);
console.log(safe); // &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello

// HTML 消毒 - 保留安全標籤
const html = '<p>Safe content</p><script>alert("bad")</script>';
const safeHTML = sanitizeHTML(html);
console.log(safeHTML); // <p>Safe content</p>

// 用戶輸入消毒（組合策略）
const input = sanitizeUserInput('  <b>Text</b>  ', {
  allowHTML: true,
  maxLength: 100,
  stripWhitespace: true
});
```

### SQL 注入防護

```typescript
import { hasSQLInjection, sanitizeSQL } from '@vibe/shared-utils';

const userInput = "admin' OR '1'='1";

// 檢測 SQL 注入
if (hasSQLInjection(userInput)) {
  console.log('Potential SQL injection detected!');
}

// 消毒 SQL 輸入（注意：仍應使用參數化查詢！）
const sanitized = sanitizeSQL(userInput);
console.log(sanitized); // admin'' OR ''1''=''1
```

### HTML 標籤過濾

```typescript
import { sanitizeHTML, stripHTML } from '@vibe/shared-utils';

const content = '<h1>Title</h1><p class="intro">Text</p><script>bad()</script>';

// 允許特定標籤和屬性
const cleaned = sanitizeHTML(content, {
  allowedTags: ['h1', 'p'],
  allowedAttributes: {
    'p': ['class']
  }
});
console.log(cleaned); // <h1>Title</h1><p class="intro">Text</p>

// 移除所有 HTML 標籤
const text = stripHTML(content);
console.log(text); // TitleText
```

### Email 驗證

```typescript
import { isEmail } from '@vibe/shared-utils';

console.log(isEmail('user@example.com')); // true
console.log(isEmail('invalid.email')); // false
console.log(isEmail('user+tag@example.co.uk')); // true
```

### URL 驗證

```typescript
import { isURL, sanitizeURL } from '@vibe/shared-utils';

console.log(isURL('https://example.com')); // true
console.log(isURL('not-a-url')); // false

// 限制協議
console.log(isURL('ftp://files.com', { protocols: ['http', 'https'] })); // false

// URL 消毒（防止惡意重定向）
const safeURL = sanitizeURL('javascript:alert(1)'); // 返回空字符串
const validURL = sanitizeURL('https://example.com', ['example.com', 'trusted.com']);
```

### 電話號碼驗證

```typescript
import { isPhoneNumber } from '@vibe/shared-utils';

// 台灣手機號碼
console.log(isPhoneNumber('0912345678', 'TW')); // true
console.log(isPhoneNumber('+886912345678', 'TW')); // true

// 美國電話
console.log(isPhoneNumber('+1-555-123-4567', 'US')); // true

// 國際格式
console.log(isPhoneNumber('+886912345678')); // true
```

### 密碼強度檢查

```typescript
import { validatePassword } from '@vibe/shared-utils';

const result = validatePassword('MyP@ssw0rd123', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
});

console.log(result);
// {
//   isValid: true,
//   score: 5,
//   strength: 'strong',
//   feedback: ['Password meets all requirements']
// }

const weak = validatePassword('12345');
console.log(weak);
// {
//   isValid: false,
//   score: 0,
//   strength: 'very-weak',
//   feedback: [
//     'Password must be at least 8 characters',
//     'Password must contain at least one uppercase letter',
//     ...
//   ]
// }
```

### 其他驗證器

```typescript
import {
  isUUID,
  isCreditCard,
  isIPAddress,
  isDate,
  isHexColor,
  isPort,
  isBase64,
  isJWT,
  isAlphanumeric,
  isMongoId
} from '@vibe/shared-utils';

// UUID 驗證
console.log(isUUID('550e8400-e29b-41d4-a716-446655440000')); // true
console.log(isUUID('550e8400-e29b-41d4-a716-446655440000', 4)); // true (v4)

// 信用卡驗證（Luhn 算法）
console.log(isCreditCard('4532015112830366')); // true

// IP 地址驗證
console.log(isIPAddress('192.168.1.1')); // true
console.log(isIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')); // true
console.log(isIPAddress('192.168.1.1', 4)); // true (IPv4)

// 日期驗證
console.log(isDate('2024-01-01')); // true
console.log(isDate(new Date())); // true

// 十六進制顏色
console.log(isHexColor('#FF5733')); // true
console.log(isHexColor('#F57')); // true

// 端口號
console.log(isPort(8080)); // true
console.log(isPort(70000)); // false

// Base64
console.log(isBase64('SGVsbG8gV29ybGQ=')); // true

// JWT Token
console.log(isJWT('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')); // true

// MongoDB ObjectId
console.log(isMongoId('507f1f77bcf86cd799439011')); // true
```

### 文件名消毒

```typescript
import { sanitizeFilename } from '@vibe/shared-utils';

// 防止目錄遍歷攻擊
const dangerous = '../../../etc/passwd';
const safe = sanitizeFilename(dangerous);
console.log(safe); // ___etc_passwd

const withSpaces = 'my file (1).txt';
const cleaned = sanitizeFilename(withSpaces);
console.log(cleaned); // my_file__1_.txt
```

### JSON 消毒（防止原型污染）

```typescript
import { sanitizeJSON } from '@vibe/shared-utils';

const malicious = '{"__proto__": {"isAdmin": true}, "name": "user"}';
const safe = sanitizeJSON(malicious);
console.log(safe); // { name: 'user' } - __proto__ 已移除
```

## 使用 Zod Schemas（需安裝 zod）

```typescript
// 安裝後使用
import {
  emailSchema,
  passwordSchema,
  userRegistrationSchema,
  paginationSchema
} from '@vibe/shared-utils';

// 單一 schema 驗證
const email = emailSchema.parse('user@example.com');

// 複雜對象驗證
const userData = userRegistrationSchema.parse({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'MyP@ssw0rd123',
  confirmPassword: 'MyP@ssw0rd123'
});

// 分頁參數驗證
const params = paginationSchema.parse({
  page: 1,
  limit: 20
});

// 錯誤處理
try {
  const invalid = emailSchema.parse('not-an-email');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors);
    // [{ message: 'Invalid email format', path: [...] }]
  }
}
```

### 自定義 Schema

```typescript
import { z } from 'zod';
import { emailSchema, passwordSchema } from '@vibe/shared-utils';

// 擴展現有 schema
const customUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  age: z.number().int().min(18).max(120),
  roles: z.array(z.enum(['user', 'admin', 'moderator']))
});

// 使用 schema helpers
import { schemaHelpers } from '@vibe/shared-utils';

const partialUser = schemaHelpers.partial(customUserSchema);
const publicUser = schemaHelpers.omit(customUserSchema, ['password']);
```

## API 使用示例

### Express 中間件

```typescript
import { sanitizeUserInput, hasSQLInjection } from '@vibe/shared-utils';
import { Request, Response, NextFunction } from 'express';

// XSS 防護中間件
export const sanitizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeUserInput(req.body[key], {
          allowHTML: false,
          maxLength: 10000,
          stripWhitespace: true
        });
      }
    }
  }
  next();
};

// SQL 注入檢測中間件
export const sqlInjectionGuard = (req: Request, res: Response, next: NextFunction) => {
  const checkObject = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && hasSQLInjection(obj[key])) {
        return res.status(400).json({
          error: 'Potential SQL injection detected'
        });
      }
      if (typeof obj[key] === 'object') {
        checkObject(obj[key]);
      }
    }
  };

  checkObject(req.query);
  checkObject(req.body);
  next();
};
```

### React 表單驗證

```typescript
import { validatePassword, isEmail } from '@vibe/shared-utils';

function RegistrationForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (data: FormData) => {
    const newErrors: Record<string, string> = {};

    // Email 驗證
    if (!isEmail(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    // 密碼驗證
    const passwordResult = validatePassword(data.password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.feedback.join(', ');
    }

    setErrors(newErrors);
  };
}
```

## 安全最佳實踐

1. **多層防護**: 結合使用多種驗證和消毒方法
2. **參數化查詢**: SQL 消毒不能替代參數化查詢/ORM
3. **服務端驗證**: 永遠在服務端驗證，客戶端驗證只是增強體驗
4. **白名單優於黑名單**: 使用允許列表而非阻止列表
5. **限制輸入長度**: 防止 DoS 攻擊
6. **記錄可疑活動**: 記錄驗證失敗和可疑輸入

## 性能考慮

- 所有驗證器都經過優化，適合高頻使用
- 正則表達式在模塊級別編譯，避免重複編譯
- 對於批量驗證，考慮使用 Zod schemas 的批量處理功能

## 測試

運行測試：
```bash
pnpm test
```

## 貢獻

歡迎貢獻新的驗證器和消毒功能！
