/**
 * Comprehensive validation utilities for common data types
 */

/**
 * Email validation with RFC 5322 compliance
 */
export function isEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Additional checks
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return false;
  if (localPart.length > 64) return false;
  if (domain.length > 255) return false;

  return emailRegex.test(email);
}

/**
 * URL validation with protocol check
 */
export function isURL(url: string, options?: { protocols?: string[] }): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    const allowedProtocols = options?.protocols || ['http', 'https'];
    return allowedProtocols.includes(parsed.protocol.replace(':', ''));
  } catch {
    return false;
  }
}

/**
 * Phone number validation (International format)
 */
export function isPhoneNumber(phone: string, region?: 'TW' | 'US' | 'CN' | 'JP'): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');

  const patterns: Record<string, RegExp> = {
    TW: /^(\+886|886|0)?9\d{8}$/,           // Taiwan mobile
    US: /^(\+1|1)?[2-9]\d{2}[2-9]\d{6}$/,  // US phone
    CN: /^(\+86|86)?1[3-9]\d{9}$/,         // China mobile
    JP: /^(\+81|81)?[789]0\d{8}$/,         // Japan mobile
    INTL: /^\+?[1-9]\d{1,14}$/             // E.164 format
  };

  const pattern = region ? patterns[region] : patterns.INTL;
  return pattern ? pattern.test(cleaned) : false;
}

/**
 * Password strength validation
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
}

export function validatePassword(
  password: string,
  options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    minScore?: number;
  }
): PasswordStrength {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options || {};

  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required'],
      strength: 'very-weak'
    };
  }

  // Length check
  if (password.length < minLength) {
    feedback.push(`Password must be at least ${minLength} characters`);
  } else {
    score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
  }

  // Character variety checks
  if (requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score++;
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score++;
  }

  if (requireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score++;
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  }

  // Common pattern checks
  if (/^(.)\1+$/.test(password)) {
    feedback.push('Password cannot be all the same character');
    score = Math.max(0, score - 2);
  }

  if (/^(012|123|234|345|456|567|678|789|890)+$/.test(password)) {
    feedback.push('Password cannot be sequential numbers');
    score = Math.max(0, score - 2);
  }

  if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) {
    feedback.push('Password cannot be sequential letters');
    score = Math.max(0, score - 2);
  }

  // Determine strength
  const strengthMap: PasswordStrength['strength'][] = [
    'very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong'
  ];
  const strength = strengthMap[Math.min(score, 5)] || 'very-weak';

  const isValid = feedback.length === 0 && score >= (options?.minScore || 3);

  return {
    isValid,
    score,
    feedback: feedback.length > 0 ? feedback : ['Password meets all requirements'],
    strength
  };
}

/**
 * UUID validation (v1, v3, v4, v5)
 */
export function isUUID(uuid: string, version?: 1 | 3 | 4 | 5): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const patterns = {
    1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    any: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  };

  return version ? patterns[version].test(uuid) : patterns.any.test(uuid);
}

/**
 * Credit card validation using Luhn algorithm
 */
export function isCreditCard(cardNumber: string): boolean {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  const cleaned = cardNumber.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    const char = cleaned[i];
    if (!char) continue;
    let digit = parseInt(char, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * IP address validation (IPv4 and IPv6)
 */
export function isIPAddress(ip: string, version?: 4 | 6): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (version === 4) {
    return ipv4Regex.test(ip);
  }
  if (version === 6) {
    return ipv6Regex.test(ip);
  }

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Date validation
 */
export function isDate(date: string | Date): boolean {
  if (!date) return false;

  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * ISO 8601 date string validation
 */
export function isISODate(date: string): boolean {
  if (!date || typeof date !== 'string') {
    return false;
  }

  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  return isoRegex.test(date) && isDate(date);
}

/**
 * JSON validation
 */
export function isJSON(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hexadecimal color validation
 */
export function isHexColor(color: string, allowAlpha = false): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const hexRegex = allowAlpha
    ? /^#([0-9A-F]{3}){1,2}([0-9A-F]{2})?$/i
    : /^#([0-9A-F]{3}){1,2}$/i;

  return hexRegex.test(color);
}

/**
 * Port number validation
 */
export function isPort(port: number | string): boolean {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return Number.isInteger(portNum) && portNum >= 0 && portNum <= 65535;
}

/**
 * MAC address validation
 */
export function isMACAddress(mac: string): boolean {
  if (!mac || typeof mac !== 'string') {
    return false;
  }

  const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;
  return macRegex.test(mac);
}

/**
 * Base64 string validation
 */
export function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
}

/**
 * JWT token validation (basic structure check)
 */
export function isJWT(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return parts.every(part => isBase64(part.replace(/-/g, '+').replace(/_/g, '/')));
}

/**
 * Alphanumeric string validation
 */
export function isAlphanumeric(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Numeric string validation
 */
export function isNumeric(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  return /^-?\d+(\.\d+)?$/.test(str);
}

/**
 * Integer validation
 */
export function isInteger(value: unknown): boolean {
  return Number.isInteger(Number(value));
}

/**
 * Positive number validation
 */
export function isPositive(value: number): boolean {
  return typeof value === 'number' && value > 0;
}

/**
 * Non-negative number validation
 */
export function isNonNegative(value: number): boolean {
  return typeof value === 'number' && value >= 0;
}

/**
 * Value in range validation
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Length validation
 */
export function hasLength(
  str: string,
  options: { min?: number; max?: number; exact?: number }
): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  if (options.exact !== undefined) {
    return str.length === options.exact;
  }

  const minValid = options.min === undefined || str.length >= options.min;
  const maxValid = options.max === undefined || str.length <= options.max;

  return minValid && maxValid;
}

/**
 * Username validation
 */
export function isUsername(username: string, options?: {
  minLength?: number;
  maxLength?: number;
  allowedCharacters?: RegExp;
}): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const {
    minLength = 3,
    maxLength = 20,
    allowedCharacters = /^[a-zA-Z0-9_-]+$/
  } = options || {};

  return (
    username.length >= minLength &&
    username.length <= maxLength &&
    allowedCharacters.test(username)
  );
}

/**
 * Slug validation (URL-friendly string)
 */
export function isSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * MongoDB ObjectId validation
 */
export function isMongoId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Mime type validation
 */
export function isMimeType(mime: string): boolean {
  if (!mime || typeof mime !== 'string') {
    return false;
  }

  return /^[a-z]+\/[a-z0-9\-\+\.]+$/i.test(mime);
}

/**
 * File extension validation
 */
export function hasExtension(filename: string, extensions: string[]): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  const ext = filename.split('.').pop();
  if (!ext) return false;

  return extensions.map(e => e.toLowerCase()).includes(ext.toLowerCase());
}
