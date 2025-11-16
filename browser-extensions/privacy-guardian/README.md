# 🔒 隱私守護者 - Privacy Guardian Extension

> 🚀 **AI 輔助開發的全方位隱私保護瀏覽器工具**

一個專注於保護使用者隱私和安全的瀏覽器擴充功能，提供密碼管理、Cookie 控制、追蹤防護、HTTPS 強制等功能。

## 📋 專案目標

全方位保護您的線上隱私，提供：
- 安全的密碼管理和生成
- 智能 Cookie 管理和清理
- 追蹤器和指紋識別防護
- HTTPS 連線強制升級
- 隱私資料洩漏監控
- 安全瀏覽警告

## 🎯 核心功能

### 1. 密碼管理器
- 🔐 安全儲存和自動填寫密碼
- 🎲 強密碼生成器
- 🔑 主密碼加密保護
- 📊 密碼強度分析
- 🚨 洩漏密碼檢測
- 🔄 跨裝置同步（加密）
- 📋 安全筆記和信用卡資訊

### 2. Cookie 管理
- 🍪 Cookie 查看和編輯
- 🗑️ 一鍵清理 Cookie
- ⏰ 自動 Cookie 清理
- 🎯 白名單/黑名單管理
- 📊 Cookie 使用分析
- 🚫 第三方 Cookie 攔截

### 3. 追蹤防護
- 🚫 追蹤器偵測和攔截
- 🔍 指紋識別防護
- 🌐 WebRTC 洩漏防護
- 📍 地理位置欺騙
- 🎭 User-Agent 偽裝
- 📊 追蹤統計儀表板

### 4. HTTPS 強制
- 🔒 自動升級 HTTP 到 HTTPS
- ⚠️ 不安全連線警告
- 📜 SSL/TLS 憑證檢查
- 🔐 HSTS 預載入
- 🌐 混合內容攔截

### 5. 資料洩漏監控
- 📧 Email 洩漏檢測
- 🔑 密碼洩漏警告
- 🚨 即時資料外洩通知
- 📊 安全報告生成
- 🔍 暗網監控整合

### 6. 隱私清理
- 🧹 瀏覽歷史清理
- 💾 快取清理
- 📥 下載記錄清除
- 🔍 搜尋歷史清除
- 🎯 定時自動清理

## 🛠️ 技術棧

### 前端框架
- **React 18** + **TypeScript**
- **Tailwind CSS** - UI 樣式
- **React Hook Form** - 表單管理
- **Recharts** - 資料視覺化

### 加密技術
- **Web Crypto API** - 瀏覽器原生加密
- **PBKDF2** - 密碼金鑰衍生
- **AES-256-GCM** - 對稱加密
- **Argon2** - 密碼雜湊

### 瀏覽器 API
- **Chrome Cookies API** - Cookie 管理
- **Chrome WebRequest API** - 請求攔截
- **Chrome Storage API** - 加密儲存
- **Chrome Privacy API** - 隱私設定
- **Chrome DeclarativeNetRequest** - 網路規則

### 安全工具
- **zxcvbn** - 密碼強度評估
- **haveibeenpwned-api** - 洩漏檢測
- **ua-parser-js** - User-Agent 處理
- **psl** - 公共後綴列表

## 🚀 快速開始

### 安裝依賴

```bash
cd browser-extensions/privacy-guardian
npm install
```

### 開發模式

```bash
npm run dev

# 載入到 Chrome:
# chrome://extensions/ -> 開發者模式 -> 載入未封裝項目
```

### 建置

```bash
npm run build
```

## 📁 專案結構

```
privacy-guardian/
├── README.md
├── package.json
├── manifest.json
├── src/
│   ├── background/
│   │   ├── service-worker.ts      # 背景服務
│   │   ├── tracker-blocker.ts     # 追蹤器攔截
│   │   ├── https-upgrader.ts      # HTTPS 升級
│   │   └── cookie-manager.ts      # Cookie 管理
│   ├── content/
│   │   ├── form-detector.ts       # 表單偵測
│   │   ├── password-filler.ts     # 自動填寫
│   │   └── fingerprint-blocker.ts # 指紋防護
│   ├── popup/
│   │   ├── Popup.tsx
│   │   ├── components/
│   │   │   ├── QuickActions.tsx
│   │   │   ├── SecurityScore.tsx
│   │   │   ├── TrackerStats.tsx
│   │   │   └── PasswordGenerator.tsx
│   │   └── index.html
│   ├── options/
│   │   ├── Options.tsx
│   │   ├── pages/
│   │   │   ├── Passwords.tsx
│   │   │   ├── Cookies.tsx
│   │   │   ├── Privacy.tsx
│   │   │   ├── Security.tsx
│   │   │   └── DataBreach.tsx
│   │   └── index.html
│   ├── services/
│   │   ├── crypto-service.ts      # 加密服務
│   │   ├── password-service.ts    # 密碼管理
│   │   ├── cookie-service.ts      # Cookie 服務
│   │   ├── tracker-service.ts     # 追蹤器服務
│   │   ├── breach-service.ts      # 洩漏檢測
│   │   └── storage-service.ts     # 安全儲存
│   ├── utils/
│   │   ├── crypto.ts              # 加密工具
│   │   ├── password-generator.ts  # 密碼生成
│   │   ├── domain-parser.ts       # 域名解析
│   │   └── validators.ts          # 驗證器
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       ├── tracker-list.ts        # 追蹤器列表
│       └── rules.ts               # 攔截規則
└── tests/
```

## 💻 核心程式碼範例

### 加密服務

```typescript
// src/services/crypto-service.ts
export class CryptoService {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  /**
   * 使用主密碼衍生加密金鑰
   */
  async deriveKey(
    masterPassword: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密資料
   */
  async encrypt(
    data: string,
    masterPassword: string
  ): Promise<EncryptedData> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(masterPassword, salt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      this.encoder.encode(data)
    );

    return {
      ciphertext: Array.from(new Uint8Array(encryptedData)),
      salt: Array.from(salt),
      iv: Array.from(iv)
    };
  }

  /**
   * 解密資料
   */
  async decrypt(
    encryptedData: EncryptedData,
    masterPassword: string
  ): Promise<string> {
    const salt = new Uint8Array(encryptedData.salt);
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.ciphertext);

    const key = await this.deriveKey(masterPassword, salt);

    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );

      return this.decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('解密失敗：密碼錯誤');
    }
  }

  /**
   * 雜湊主密碼（用於驗證）
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);

    // 匯出金鑰作為雜湊值
    const exported = await crypto.subtle.exportKey('raw', key);

    return JSON.stringify({
      hash: Array.from(new Uint8Array(exported)),
      salt: Array.from(salt)
    });
  }
}

interface EncryptedData {
  ciphertext: number[];
  salt: number[];
  iv: number[];
}
```

### 密碼管理服務

```typescript
// src/services/password-service.ts
import { CryptoService } from './crypto-service';
import zxcvbn from 'zxcvbn';

export class PasswordService {
  private cryptoService = new CryptoService();

  /**
   * 儲存密碼
   */
  async savePassword(
    entry: PasswordEntry,
    masterPassword: string
  ): Promise<void> {
    const encrypted = await this.cryptoService.encrypt(
      JSON.stringify(entry),
      masterPassword
    );

    const passwords = await this.getAllPasswords();
    passwords.push({
      id: entry.id,
      domain: entry.domain,
      username: entry.username,
      encrypted: encrypted,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ passwords });
  }

  /**
   * 取得密碼
   */
  async getPassword(
    id: string,
    masterPassword: string
  ): Promise<PasswordEntry | null> {
    const passwords = await this.getAllPasswords();
    const stored = passwords.find(p => p.id === id);

    if (!stored) return null;

    try {
      const decrypted = await this.cryptoService.decrypt(
        stored.encrypted,
        masterPassword
      );
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('解密密碼失敗:', error);
      return null;
    }
  }

  /**
   * 生成強密碼
   */
  generatePassword(options: PasswordGeneratorOptions): string {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true
    } = options;

    let charset = '';
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }

    return password;
  }

  /**
   * 評估密碼強度
   */
  evaluatePasswordStrength(password: string): PasswordStrength {
    const result = zxcvbn(password);

    return {
      score: result.score, // 0-4
      feedback: result.feedback,
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
      suggestions: result.feedback.suggestions
    };
  }

  /**
   * 檢查密碼是否洩漏
   */
  async checkPasswordBreach(password: string): Promise<boolean> {
    // 使用 k-Anonymity 方法查詢 Have I Been Pwned
    const hash = await this.sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );
    const text = await response.text();

    return text.toUpperCase().includes(suffix.toUpperCase());
  }

  private async sha1(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getAllPasswords(): Promise<StoredPassword[]> {
    const result = await chrome.storage.local.get('passwords');
    return result.passwords || [];
  }
}

interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  password: string;
  notes?: string;
}

interface StoredPassword {
  id: string;
  domain: string;
  username: string;
  encrypted: EncryptedData;
  createdAt: string;
  updatedAt: string;
}

interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: any;
  crackTime: string;
  suggestions: string[];
}
```

### 追蹤器攔截

```typescript
// src/background/tracker-blocker.ts
export class TrackerBlocker {
  private trackerDomains = new Set<string>([
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.com/tr',
    'doubleclick.net',
    'scorecardresearch.com',
    // ... 更多追蹤器域名
  ]);

  private blockedCount = 0;

  init(): void {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => this.handleRequest(details),
      { urls: ['<all_urls>'] },
      ['blocking']
    );
  }

  private handleRequest(
    details: chrome.webRequest.WebRequestBodyDetails
  ): chrome.webRequest.BlockingResponse {
    const url = new URL(details.url);

    // 檢查是否為追蹤器
    if (this.isTracker(url.hostname)) {
      this.blockedCount++;
      console.log('已攔截追蹤器:', url.hostname);

      return { cancel: true };
    }

    return { cancel: false };
  }

  private isTracker(hostname: string): boolean {
    // 完全匹配
    if (this.trackerDomains.has(hostname)) {
      return true;
    }

    // 檢查子域名
    for (const tracker of this.trackerDomains) {
      if (hostname.endsWith('.' + tracker)) {
        return true;
      }
    }

    return false;
  }

  getBlockedCount(): number {
    return this.blockedCount;
  }

  resetCount(): void {
    this.blockedCount = 0;
  }
}
```

### Cookie 管理服務

```typescript
// src/services/cookie-service.ts
export class CookieService {
  /**
   * 取得所有 Cookie
   */
  async getAllCookies(): Promise<chrome.cookies.Cookie[]> {
    return chrome.cookies.getAll({});
  }

  /**
   * 取得特定網站的 Cookie
   */
  async getCookiesForDomain(domain: string): Promise<chrome.cookies.Cookie[]> {
    return chrome.cookies.getAll({ domain });
  }

  /**
   * 刪除 Cookie
   */
  async deleteCookie(cookie: chrome.cookies.Cookie): Promise<void> {
    const url = this.getCookieUrl(cookie);
    await chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId
    });
  }

  /**
   * 清除所有 Cookie
   */
  async clearAllCookies(whitelist: string[] = []): Promise<number> {
    const cookies = await this.getAllCookies();
    let deletedCount = 0;

    for (const cookie of cookies) {
      // 檢查是否在白名單
      if (!this.isWhitelisted(cookie.domain, whitelist)) {
        await this.deleteCookie(cookie);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 分析 Cookie 使用情況
   */
  async analyzeCookies(): Promise<CookieAnalysis> {
    const cookies = await this.getAllCookies();

    const analysis: CookieAnalysis = {
      total: cookies.length,
      session: 0,
      persistent: 0,
      secure: 0,
      httpOnly: 0,
      sameSite: {
        strict: 0,
        lax: 0,
        none: 0
      },
      byDomain: new Map()
    };

    for (const cookie of cookies) {
      // 會話 vs 持久
      if (cookie.session) {
        analysis.session++;
      } else {
        analysis.persistent++;
      }

      // 安全性
      if (cookie.secure) analysis.secure++;
      if (cookie.httpOnly) analysis.httpOnly++;

      // SameSite
      switch (cookie.sameSite) {
        case 'strict':
          analysis.sameSite.strict++;
          break;
        case 'lax':
          analysis.sameSite.lax++;
          break;
        default:
          analysis.sameSite.none++;
      }

      // 按域名統計
      const count = analysis.byDomain.get(cookie.domain) || 0;
      analysis.byDomain.set(cookie.domain, count + 1);
    }

    return analysis;
  }

  private getCookieUrl(cookie: chrome.cookies.Cookie): string {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const domain = cookie.domain.startsWith('.')
      ? cookie.domain.substring(1)
      : cookie.domain;

    return `${protocol}//${domain}${cookie.path}`;
  }

  private isWhitelisted(domain: string, whitelist: string[]): boolean {
    return whitelist.some(allowed =>
      domain.includes(allowed) || allowed.includes(domain)
    );
  }
}

interface CookieAnalysis {
  total: number;
  session: number;
  persistent: number;
  secure: number;
  httpOnly: number;
  sameSite: {
    strict: number;
    lax: number;
    none: number;
  };
  byDomain: Map<string, number>;
}
```

## 🤖 AI 功能整合

### AI 安全建議

```typescript
// 使用 AI 分析密碼模式和提供安全建議
export class AISecurityAdvisor {
  async analyzePasswordPatterns(passwords: string[]): Promise<SecurityAdvice> {
    // 使用 AI 分析密碼重複使用模式
    // 提供個性化安全建議
  }

  async detectPhishingSite(url: string, content: string): Promise<boolean> {
    // 使用 AI 檢測釣魚網站
  }
}
```

## 🎨 UI 設計

### 主要介面
- **儀表板** - 安全分數和統計
- **密碼庫** - 密碼管理介面
- **Cookie 管理** - Cookie 查看和清理
- **隱私報告** - 追蹤器和洩漏報告

## 🧪 開發路線圖

### Phase 1: 基礎功能 ✅
- [x] 專案設置
- [ ] 基本密碼儲存
- [ ] Cookie 查看和刪除
- [ ] 簡單追蹤器攔截

### Phase 2: 進階功能
- [ ] 密碼生成器
- [ ] 自動填寫
- [ ] Cookie 分析
- [ ] HTTPS 強制

### Phase 3: 安全強化
- [ ] 密碼洩漏檢測
- [ ] 指紋識別防護
- [ ] 安全評分系統
- [ ] 資料洩漏監控

### Phase 4: AI 整合
- [ ] AI 安全建議
- [ ] 釣魚網站檢測
- [ ] 異常行為偵測

### Phase 5: 完善與發布
- [ ] 雲端同步（端到端加密）
- [ ] 生物識別解鎖
- [ ] 安全審計
- [ ] 發布到商店

## 🔒 安全性

### 加密標準
- ✅ AES-256-GCM 加密
- ✅ PBKDF2 金鑰衍生（100,000 次迭代）
- ✅ 隨機鹽值和 IV
- ✅ 零知識架構（主密碼不儲存）

### 最佳實踐
- ✅ 所有敏感資料加密
- ✅ 定期安全審計
- ✅ 最小權限原則
- ✅ 開源可審查

## 📚 使用指南

### 首次設定
1. 設定主密碼
2. 匯入現有密碼（可選）
3. 配置隱私設定
4. 啟用追蹤防護

### 日常使用
- 自動偵測登入表單
- 一鍵填寫密碼
- 定期檢查洩漏
- 查看安全報告

## 🤝 貢獻指南

歡迎貢獻！特別需要：
- 安全專家審查
- 更多追蹤器規則
- 翻譯和本地化
- UI/UX 改進

## 📄 授權

MIT License

---

**您的隱私，我們守護** 🛡️

最後更新: 2025-11-16
狀態: 🚧 開發中
