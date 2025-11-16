// 全局類型定義

export interface EncryptedData {
  ciphertext: number[];
  salt: number[];
  iv: number[];
}

export interface PasswordEntry {
  id: string;
  domain: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPassword {
  id: string;
  domain: string;
  url: string;
  username: string;
  encrypted: EncryptedData;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

export interface PasswordStrength {
  score: number;
  feedback: any;
  crackTime: string;
  suggestions: string[];
}

export interface CookieAnalysis {
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

export interface TrackerStats {
  totalBlocked: number;
  blockedToday: number;
  blockedByDomain: Map<string, number>;
  lastReset: string;
}

export interface PrivacySettings {
  enableTrackerBlocking: boolean;
  enableCookieProtection: boolean;
  enableHttpsUpgrade: boolean;
  enablePasswordManager: boolean;
  autoCleanCookies: boolean;
  cookieWhitelist: string[];
  trackerBlockingLevel: 'strict' | 'moderate' | 'permissive';
}

export interface SecurityScore {
  score: number;
  maxScore: number;
  factors: {
    passwordSecurity: number;
    trackersBlocked: number;
    httpsUsage: number;
    cookieSecurity: number;
  };
  recommendations: string[];
}

export interface DataBreach {
  email: string;
  breaches: {
    name: string;
    domain: string;
    breachDate: string;
    dataClasses: string[];
  }[];
  lastChecked: string;
}
