/**
 * HTTP 安全頭中間件和 CORS 配置
 */

import { Request, Response, NextFunction } from 'express';

// ============================================
// CORS 配置
// ============================================

export interface CorsOptions {
  /** 允許的來源列表，或函數來動態驗證 */
  origin?: string[] | ((origin: string | undefined) => boolean);
  /** 允許的 HTTP 方法 */
  methods?: string[];
  /** 允許的請求頭 */
  allowedHeaders?: string[];
  /** 暴露給客戶端的響應頭 */
  exposedHeaders?: string[];
  /** 是否允許攜帶憑證 */
  credentials?: boolean;
  /** 預檢請求的快取時間（秒） */
  maxAge?: number;
}

/**
 * 創建安全的 CORS 配置
 * @param options CORS 選項
 * @returns 標準化的 CORS 配置對象
 *
 * @example
 * // Express 使用
 * import cors from 'cors';
 * app.use(cors(createCorsConfig({ origin: ['https://example.com'] })));
 *
 * @example
 * // Socket.io 使用
 * const io = new Server(server, { cors: createCorsConfig() });
 */
export function createCorsConfig(options: CorsOptions = {}): {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
} {
  const {
    origin: allowedOrigins = getDefaultOrigins(),
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders = ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials = true,
    maxAge = 86400, // 24 小時
  } = options;

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // 允許無 origin 的請求（如伺服器端請求、移動應用）
      if (!origin) {
        return callback(null, true);
      }

      let isAllowed = false;

      if (typeof allowedOrigins === 'function') {
        isAllowed = allowedOrigins(origin);
      } else if (Array.isArray(allowedOrigins)) {
        isAllowed = allowedOrigins.some((allowed) => {
          if (allowed === '*') return true;
          if (allowed.startsWith('*.')) {
            // 支援萬用字元子網域，如 *.example.com
            const domain = allowed.slice(2);
            return origin.endsWith(domain);
          }
          return allowed === origin;
        });
      }

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
      }
    },
    methods,
    allowedHeaders,
    exposedHeaders,
    credentials,
    maxAge,
  };
}

/**
 * 從環境變數獲取預設允許的來源
 */
function getDefaultOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }

  // 開發環境預設值
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
  }

  // 生產環境必須明確指定
  return [];
}

/**
 * CORS 預設配置
 */
export const corsPresets = {
  /** 嚴格模式：只允許指定的來源 */
  strict: (origins: string[]): CorsOptions => ({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),

  /** 開發模式：允許本地開發常用端口 */
  development: (): CorsOptions => ({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  }),

  /** API 模式：適用於公開 API */
  api: (origins: string[]): CorsOptions => ({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: false,
  }),
};

export interface SecurityHeadersOptions {
  contentSecurityPolicy?: boolean | {
    directives: Record<string, string[]>;
  };
  xssFilter?: boolean;
  noSniff?: boolean;
  frameGuard?: boolean | 'deny' | 'sameorigin';
  hsts?: boolean | {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
}

/**
 * 安全頭中間件
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const {
    contentSecurityPolicy = true,
    xssFilter = true,
    noSniff = true,
    frameGuard = 'deny',
    hsts = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy
  } = options;

  return (_req: Request, res: Response, next: NextFunction) => {
    // X-XSS-Protection
    if (xssFilter) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Content-Type-Options
    if (noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (frameGuard) {
      const value = frameGuard === true ? 'DENY' : frameGuard.toUpperCase();
      res.setHeader('X-Frame-Options', value);
    }

    // Strict-Transport-Security
    if (hsts) {
      const hstsOptions = hsts === true
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : hsts;
      let value = `max-age=${hstsOptions.maxAge}`;
      if (hstsOptions.includeSubDomains) value += '; includeSubDomains';
      if (hstsOptions.preload) value += '; preload';
      res.setHeader('Strict-Transport-Security', value);
    }

    // Referrer-Policy
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', referrerPolicy);
    }

    // Content-Security-Policy
    if (contentSecurityPolicy) {
      const directives = contentSecurityPolicy === true
        ? {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"],
            "font-src": ["'self'"],
            "connect-src": ["'self'"],
            "frame-ancestors": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"]
          }
        : contentSecurityPolicy.directives;

      const csp = Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      res.setHeader('Content-Security-Policy', csp);
    }

    // Permissions-Policy
    if (permissionsPolicy) {
      const policy = Object.entries(permissionsPolicy)
        .map(([key, values]) => `${key}=(${values.join(' ')})`)
        .join(', ');
      res.setHeader('Permissions-Policy', policy);
    }

    // 其他安全頭
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
}

/**
 * 預設安全配置
 */
export const securityPresets = {
  // 嚴格模式（適用於 API）
  strict: (): SecurityHeadersOptions => ({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"]
      }
    },
    xssFilter: true,
    noSniff: true,
    frameGuard: 'deny',
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: 'no-referrer'
  }),

  // Web 應用模式
  web: (): SecurityHeadersOptions => ({
    contentSecurityPolicy: true,
    xssFilter: true,
    noSniff: true,
    frameGuard: 'sameorigin',
    hsts: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  }),

  // 開發模式（寬鬆）
  development: (): SecurityHeadersOptions => ({
    contentSecurityPolicy: false,
    xssFilter: true,
    noSniff: true,
    frameGuard: false,
    hsts: false
  })
};
