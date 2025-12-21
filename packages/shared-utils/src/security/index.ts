/**
 * HTTP 安全頭中間件
 */

import { Request, Response, NextFunction } from 'express';

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

  return (req: Request, res: Response, next: NextFunction) => {
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
