/**
 * Validation Examples
 * Demonstrates input validation, sanitization, and custom validators
 */

import {
  // Validators
  isEmail,
  isURL,
  isPhoneNumber,
  validatePassword,
  isUUID,
  isCreditCard,
  isIPAddress,
  isDate,
  isISODate,
  isJSON,
  isHexColor,
  isPort,
  isMACAddress,
  isBase64,
  isJWT,
  isAlphanumeric,
  isNumeric,
  isInteger,
  isPositive,
  isNonNegative,
  isInRange,
  hasLength,
  isUsername,
  isSlug,
  isMongoId,
  isMimeType,
  hasExtension,
  // Sanitizers
  sanitizeXSS,
  sanitizeHTML,
  hasSQLInjection,
  sanitizeSQL,
  stripHTML,
  sanitizeFilename,
  sanitizeURL,
  sanitizeJSON,
  sanitizeUserInput,
  escapeRegExp,
} from '@vibe/shared-utils';

// =============================================================================
// Example 1: Email and URL Validation
// =============================================================================

export function validateEmailsExample() {
  const emails = [
    'valid@example.com',
    'user.name+tag@example.co.uk',
    'invalid@',
    '@invalid.com',
    'no-at-sign.com',
    'spaces in@email.com',
  ];

  console.log('Email Validation:');
  emails.forEach(email => {
    console.log(`  ${email}: ${isEmail(email) ? '✓ Valid' : '✗ Invalid'}`);
  });
  // Output:
  // valid@example.com: ✓ Valid
  // user.name+tag@example.co.uk: ✓ Valid
  // invalid@: ✗ Invalid
  // @invalid.com: ✗ Invalid
  // no-at-sign.com: ✗ Invalid
  // spaces in@email.com: ✗ Invalid
}

export function validateURLsExample() {
  const urls = [
    'https://example.com',
    'http://localhost:3000',
    'ftp://files.example.com',
    'not-a-url',
    'javascript:alert("xss")',
  ];

  console.log('\nURL Validation:');
  urls.forEach(url => {
    const isValid = isURL(url);
    const isValidHttp = isURL(url, { protocols: ['http', 'https'] });
    console.log(`  ${url}:`);
    console.log(`    Any protocol: ${isValid ? '✓' : '✗'}`);
    console.log(`    HTTP(S) only: ${isValidHttp ? '✓' : '✗'}`);
  });
}

// =============================================================================
// Example 2: Password Validation
// =============================================================================

export function validatePasswordsExample() {
  const passwords = [
    'weak',
    'LongerButNoNumber',
    'Passw0rd',
    'Str0ng!Pass',
    'VeryStr0ng!Passw0rd123',
  ];

  console.log('\nPassword Validation:');
  passwords.forEach(password => {
    const result = validatePassword(password);
    console.log(`\n  Password: "${password}"`);
    console.log(`    Valid: ${result.isValid ? '✓' : '✗'}`);
    console.log(`    Strength: ${result.strength} (score: ${result.score}/5)`);
    console.log(`    Feedback: ${result.feedback.join(', ')}`);
  });
  // Example output:
  // Password: "Str0ng!Pass"
  //   Valid: ✓
  //   Strength: strong (score: 4/5)
  //   Feedback: Password meets all requirements
}

export function customPasswordValidation() {
  // Custom password requirements
  const result = validatePassword('MyP@ss123', {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    minScore: 4,
  });

  console.log('\nCustom Password Validation:');
  console.log('  Valid:', result.isValid);
  console.log('  Feedback:', result.feedback);

  return result;
}

// =============================================================================
// Example 3: Phone Number Validation
// =============================================================================

export function validatePhoneNumbersExample() {
  const phones = {
    TW: ['0912345678', '886912345678', '+886912345678', '0812345678'],
    US: ['5551234567', '15551234567', '+15551234567'],
    CN: ['13812345678', '8613812345678', '+8613812345678'],
  };

  console.log('\nPhone Number Validation:');

  Object.entries(phones).forEach(([region, numbers]) => {
    console.log(`\n  ${region} Numbers:`);
    numbers.forEach(phone => {
      const isValid = isPhoneNumber(phone, region as 'TW' | 'US' | 'CN');
      console.log(`    ${phone}: ${isValid ? '✓' : '✗'}`);
    });
  });
}

// =============================================================================
// Example 4: Format and ID Validators
// =============================================================================

export function validateFormatsExample() {
  console.log('\nFormat Validators:');

  // UUID
  console.log('  UUIDs:');
  const uuids = [
    '123e4567-e89b-12d3-a456-426614174000',
    'invalid-uuid',
  ];
  uuids.forEach(uuid => {
    console.log(`    ${uuid}: ${isUUID(uuid) ? '✓' : '✗'}`);
  });

  // Credit Card (Luhn algorithm)
  console.log('\n  Credit Cards:');
  const cards = [
    '4532015112830366', // Valid Visa
    '1234567890123456', // Invalid
  ];
  cards.forEach(card => {
    console.log(`    ${card}: ${isCreditCard(card) ? '✓' : '✗'}`);
  });

  // IP Address
  console.log('\n  IP Addresses:');
  const ips = [
    { ip: '192.168.1.1', version: 4 },
    { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', version: 6 },
    { ip: '256.1.1.1', version: 4 },
  ];
  ips.forEach(({ ip, version }) => {
    const isValid = isIPAddress(ip, version as 4 | 6);
    console.log(`    ${ip} (IPv${version}): ${isValid ? '✓' : '✗'}`);
  });

  // MongoDB ObjectId
  console.log('\n  MongoDB ObjectIds:');
  const mongoIds = [
    '507f1f77bcf86cd799439011',
    'invalid-objectid',
  ];
  mongoIds.forEach(id => {
    console.log(`    ${id}: ${isMongoId(id) ? '✓' : '✗'}`);
  });

  // JWT Token
  console.log('\n  JWT Tokens:');
  const tokens = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'not.a.token',
  ];
  tokens.forEach(token => {
    console.log(`    ${token.substring(0, 30)}...: ${isJWT(token) ? '✓' : '✗'}`);
  });
}

// =============================================================================
// Example 5: String Content Validators
// =============================================================================

export function validateStringContentExample() {
  console.log('\nString Content Validators:');

  // Alphanumeric
  console.log('  Alphanumeric:');
  const alphanumerics = ['abc123', 'abc-123', 'abc 123'];
  alphanumerics.forEach(str => {
    console.log(`    "${str}": ${isAlphanumeric(str) ? '✓' : '✗'}`);
  });

  // Numeric
  console.log('\n  Numeric:');
  const numerics = ['123', '123.45', '-123', 'abc'];
  numerics.forEach(str => {
    console.log(`    "${str}": ${isNumeric(str) ? '✓' : '✗'}`);
  });

  // Integer
  console.log('\n  Integer:');
  const integers = [123, 123.45, '123', '123.45'];
  integers.forEach(val => {
    console.log(`    ${val}: ${isInteger(val) ? '✓' : '✗'}`);
  });

  // Hex Color
  console.log('\n  Hex Colors:');
  const colors = ['#FF5733', '#FFF', '#FF573G', '#FF5733AA'];
  colors.forEach(color => {
    console.log(`    ${color}: ${isHexColor(color) ? '✓' : '✗'}`);
    console.log(`    ${color} (with alpha): ${isHexColor(color, true) ? '✓' : '✗'}`);
  });

  // Username
  console.log('\n  Usernames:');
  const usernames = ['john_doe', 'a', 'user-name-123', 'user@name'];
  usernames.forEach(username => {
    console.log(`    "${username}": ${isUsername(username) ? '✓' : '✗'}`);
  });

  // Slug (URL-friendly)
  console.log('\n  Slugs:');
  const slugs = ['hello-world', 'hello_world', 'hello-world-123', 'Hello-World'];
  slugs.forEach(slug => {
    console.log(`    "${slug}": ${isSlug(slug) ? '✓' : '✗'}`);
  });
}

// =============================================================================
// Example 6: Range and Length Validators
// =============================================================================

export function validateRangesExample() {
  console.log('\nRange and Length Validators:');

  // Number ranges
  console.log('  Number in range [0, 100]:');
  const numbers = [-1, 0, 50, 100, 101];
  numbers.forEach(num => {
    console.log(`    ${num}: ${isInRange(num, 0, 100) ? '✓' : '✗'}`);
  });

  // Positive/Non-negative
  console.log('\n  Positive numbers:');
  const positives = [-1, 0, 1];
  positives.forEach(num => {
    console.log(`    ${num}: positive=${isPositive(num) ? '✓' : '✗'}, non-negative=${isNonNegative(num) ? '✓' : '✗'}`);
  });

  // String length
  console.log('\n  String length validation:');
  const strings = ['hi', 'hello', 'hello world'];
  strings.forEach(str => {
    const min5 = hasLength(str, { min: 5 });
    const max8 = hasLength(str, { max: 8 });
    const exact5 = hasLength(str, { exact: 5 });
    console.log(`    "${str}" (length ${str.length}):`);
    console.log(`      min 5: ${min5 ? '✓' : '✗'}, max 8: ${max8 ? '✓' : '✗'}, exact 5: ${exact5 ? '✓' : '✗'}`);
  });

  // Port numbers
  console.log('\n  Port numbers:');
  const ports = [-1, 0, 80, 8080, 65535, 65536];
  ports.forEach(port => {
    console.log(`    ${port}: ${isPort(port) ? '✓' : '✗'}`);
  });
}

// =============================================================================
// Example 7: XSS Sanitization
// =============================================================================

export function sanitizeXSSExample() {
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(\'XSS\')">',
    'Hello <b>World</b>',
    'javascript:alert("XSS")',
    '<iframe src="malicious.com"></iframe>',
  ];

  console.log('\nXSS Sanitization:');
  maliciousInputs.forEach(input => {
    const sanitized = sanitizeXSS(input);
    console.log(`  Input:     ${input}`);
    console.log(`  Sanitized: ${sanitized}\n`);
  });
  // Output will have all dangerous tags removed and special chars encoded
}

// =============================================================================
// Example 8: HTML Sanitization
// =============================================================================

export function sanitizeHTMLExample() {
  const htmlInput = `
    <div class="content">
      <h1>Title</h1>
      <p>Safe paragraph with <strong>bold</strong> text</p>
      <script>alert('dangerous');</script>
      <a href="https://safe.com">Safe Link</a>
      <a href="javascript:alert('xss')">Dangerous Link</a>
      <img src="image.jpg" alt="Safe Image">
      <img src=x onerror="alert('xss')">
    </div>
  `;

  console.log('\nHTML Sanitization:');
  console.log('Input:', htmlInput);

  const sanitized = sanitizeHTML(htmlInput, {
    allowedTags: ['div', 'p', 'strong', 'a', 'img', 'h1'],
    allowedAttributes: {
      'div': ['class'],
      'a': ['href'],
      'img': ['src', 'alt'],
    },
    allowedProtocols: ['http', 'https'],
  });

  console.log('\nSanitized:', sanitized);
  // Removes <script>, dangerous event handlers, and javascript: URLs
}

export function stripHTMLExample() {
  const htmlStrings = [
    '<p>Hello <strong>World</strong></p>',
    '<div><script>alert("xss")</script>Text</div>',
    'No HTML here',
  ];

  console.log('\nStrip HTML:');
  htmlStrings.forEach(html => {
    const stripped = stripHTML(html);
    console.log(`  Input:    ${html}`);
    console.log(`  Stripped: ${stripped}\n`);
  });
}

// =============================================================================
// Example 9: SQL Injection Prevention
// =============================================================================

export function preventSQLInjectionExample() {
  const inputs = [
    "admin' OR '1'='1",
    "'; DROP TABLE users; --",
    "normal input",
    "1' UNION SELECT * FROM passwords--",
  ];

  console.log('\nSQL Injection Detection:');
  inputs.forEach(input => {
    const hasSQLi = hasSQLInjection(input);
    const sanitized = sanitizeSQL(input);
    console.log(`  Input:     ${input}`);
    console.log(`  Has SQLi:  ${hasSQLi ? '⚠️  Yes' : '✓ No'}`);
    console.log(`  Sanitized: ${sanitized}\n`);
  });

  console.log('⚠️  WARNING: Always use parameterized queries instead of sanitization!');
}

// =============================================================================
// Example 10: File and URL Sanitization
// =============================================================================

export function sanitizeFileAndURLExample() {
  console.log('\nFilename Sanitization:');
  const filenames = [
    'normal-file.txt',
    '../../../etc/passwd',
    'file with spaces.pdf',
    'file<script>.txt',
    'valid_file-2024.jpg',
  ];

  filenames.forEach(filename => {
    const sanitized = sanitizeFilename(filename);
    console.log(`  ${filename} → ${sanitized}`);
  });

  console.log('\nURL Sanitization:');
  const urls = [
    'https://example.com/page',
    'javascript:alert("xss")',
    'http://malicious.com',
    'ftp://files.example.com',
  ];

  const allowedDomains = ['example.com'];
  urls.forEach(url => {
    const sanitized = sanitizeURL(url, allowedDomains);
    console.log(`  ${url} → ${sanitized || '(blocked)'}`);
  });
}

// =============================================================================
// Example 11: JSON Sanitization (Prototype Pollution Prevention)
// =============================================================================

export function sanitizeJSONExample() {
  const maliciousJSON = JSON.stringify({
    name: 'John',
    __proto__: { isAdmin: true },
    constructor: { prototype: { isAdmin: true } },
    data: { value: 'safe' },
  });

  console.log('\nJSON Sanitization (Prototype Pollution Prevention):');
  console.log('Input:', maliciousJSON);

  const sanitized = sanitizeJSON(maliciousJSON);
  console.log('\nSanitized:', sanitized);
  // __proto__ and constructor will be removed
}

// =============================================================================
// Example 12: User Input Sanitization
// =============================================================================

export function sanitizeUserInputExample() {
  const inputs = [
    { value: '  Hello World  ', allowHTML: false },
    { value: '<p>Safe <strong>HTML</strong></p>', allowHTML: true },
    { value: '<script>alert("xss")</script>Text', allowHTML: true },
    { value: 'Very long string that should be truncated...'.repeat(10), allowHTML: false },
  ];

  console.log('\nUser Input Sanitization:');
  inputs.forEach(({ value, allowHTML }) => {
    const sanitized = sanitizeUserInput(value, {
      allowHTML,
      maxLength: 100,
      stripWhitespace: true,
    });

    console.log(`  Input (${allowHTML ? 'HTML allowed' : 'No HTML'}):`);
    console.log(`    ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    console.log(`  Sanitized:`);
    console.log(`    ${sanitized}\n`);
  });
}

// =============================================================================
// Example 13: Custom Validators
// =============================================================================

/**
 * Custom validator: Taiwan National ID
 */
export function isTaiwanNationalId(id: string): boolean {
  if (!/^[A-Z][12]\d{8}$/.test(id)) {
    return false;
  }

  // Verify checksum
  const letterValue: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
    K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
    U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
  };

  const letter = letterValue[id[0]];
  if (!letter) return false;

  const digits = id.substring(1).split('').map(Number);
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  let sum = Math.floor(letter / 10) + (letter % 10) * 9;
  digits.forEach((digit, i) => {
    sum += digit * weights[i];
  });

  return sum % 10 === 0;
}

/**
 * Custom validator: Strong password with custom rules
 */
export function isCompanyPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special character');
  }

  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common pattern');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Custom validator: Business email (exclude free email providers)
 */
export function isBusinessEmail(email: string): boolean {
  if (!isEmail(email)) {
    return false;
  }

  const freeProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return !freeProviders.includes(domain || '');
}

/**
 * Example: Using custom validators
 */
export function customValidatorsExample() {
  console.log('\nCustom Validators:');

  // Taiwan National ID
  console.log('  Taiwan National IDs:');
  const taiwanIds = ['A123456789', 'Z987654321', 'INVALID123'];
  taiwanIds.forEach(id => {
    console.log(`    ${id}: ${isTaiwanNationalId(id) ? '✓' : '✗'}`);
  });

  // Company passwords
  console.log('\n  Company Passwords:');
  const passwords = ['Weak1!', 'CompanyP@ssw0rd123'];
  passwords.forEach(pwd => {
    const result = isCompanyPassword(pwd);
    console.log(`    "${pwd}": ${result.isValid ? '✓' : '✗'}`);
    if (!result.isValid) {
      result.errors.forEach(err => console.log(`      - ${err}`));
    }
  });

  // Business emails
  console.log('\n  Business Emails:');
  const emails = ['user@company.com', 'personal@gmail.com', 'work@outlook.com'];
  emails.forEach(email => {
    console.log(`    ${email}: ${isBusinessEmail(email) ? '✓ Business' : '✗ Personal'}`);
  });
}

// =============================================================================
// Example 14: Form Validation Helper
// =============================================================================

interface FormField {
  value: string;
  rules: Array<(value: string) => string | undefined>;
}

export function validateForm(fields: Record<string, FormField>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  Object.entries(fields).forEach(([fieldName, field]) => {
    for (const rule of field.rules) {
      const error = rule(field.value);
      if (error) {
        errors[fieldName] = error;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Example: Complete form validation
 */
export function formValidationExample() {
  const form = {
    email: {
      value: 'user@example.com',
      rules: [
        (v: string) => (!v ? 'Email is required' : undefined),
        (v: string) => (!isEmail(v) ? 'Invalid email format' : undefined),
      ],
    },
    password: {
      value: 'MyP@ssw0rd123',
      rules: [
        (v: string) => (!v ? 'Password is required' : undefined),
        (v: string) => {
          const result = validatePassword(v, { minScore: 4 });
          return result.isValid ? undefined : result.feedback.join(', ');
        },
      ],
    },
    website: {
      value: 'https://example.com',
      rules: [
        (v: string) => (v && !isURL(v) ? 'Invalid URL' : undefined),
      ],
    },
  };

  const validation = validateForm(form);

  console.log('\nForm Validation Example:');
  console.log('  Valid:', validation.isValid);
  if (!validation.isValid) {
    console.log('  Errors:');
    Object.entries(validation.errors).forEach(([field, error]) => {
      console.log(`    ${field}: ${error}`);
    });
  }

  return validation;
}
