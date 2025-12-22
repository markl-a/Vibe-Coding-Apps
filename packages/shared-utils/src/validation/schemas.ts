/**
 * Common Zod validation schemas
 *
 * INSTALLATION REQUIRED:
 * Run: pnpm add zod
 *
 * These schemas provide reusable validation patterns for common data types
 */

import { z } from 'zod';

/**
 * Email schema with custom validation
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .transform(email => email.toLowerCase().trim());

/**
 * Password schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

/**
 * Strong password schema (more strict)
 */
export const strongPasswordSchema = passwordSchema
  .min(12, 'Strong password must be at least 12 characters')
  .regex(/^(?!.*(.)\1{2})/, 'Password cannot have 3 repeating characters');

/**
 * URL schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long');

/**
 * Phone number schema (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(phone => phone.replace(/[\s\-()]/g, ''));

/**
 * Taiwan phone number schema
 */
export const phoneTWSchema = z
  .string()
  .regex(/^(\+886|886|0)?9\d{8}$/, 'Invalid Taiwan phone number')
  .transform(phone => phone.replace(/[\s\-()]/g, ''));

/**
 * UUID schema (v4)
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * MongoDB ObjectId schema
 */
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

/**
 * Username schema
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(username => username.toLowerCase());

/**
 * Slug schema (URL-friendly string)
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only');

/**
 * Hex color schema
 */
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid hex color format')
  .transform(color => color.toUpperCase());

/**
 * Port number schema
 */
export const portSchema = z
  .number()
  .int('Port must be an integer')
  .min(0, 'Port must be at least 0')
  .max(65535, 'Port must be at most 65535');

/**
 * Positive integer schema
 */
export const positiveIntSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive');

/**
 * Non-negative integer schema
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be non-negative');

/**
 * Date schema (ISO 8601)
 */
export const dateSchema = z
  .string()
  .datetime('Invalid date format')
  .or(z.date());

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  start: dateSchema,
  end: dateSchema
}).refine(
  data => new Date(data.start) <= new Date(data.end),
  { message: 'Start date must be before or equal to end date' }
);

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: positiveIntSchema.default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(10),
  offset: nonNegativeIntSchema.optional()
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  order: z.enum(['asc', 'desc']).default('asc')
});

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename is too long'),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid mime type'),
  size: z.number().int().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB')
});

/**
 * Image upload schema
 */
export const imageUploadSchema = fileUploadSchema.extend({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, GIF, and WebP images are allowed' })
  }),
  size: z.number().int().positive().max(5 * 1024 * 1024, 'Image size must be less than 5MB')
});

/**
 * Coordinates schema (latitude, longitude)
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180')
});

/**
 * Address schema
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(2, 'Country code must be at least 2 characters').max(2, 'Country code must be 2 characters')
});

/**
 * Credit card schema (basic validation)
 */
export const creditCardSchema = z.object({
  number: z.string().regex(/^\d{13,19}$/, 'Invalid credit card number'),
  expiryMonth: z.number().int().min(1).max(12, 'Invalid expiry month'),
  expiryYear: z.number().int().min(new Date().getFullYear(), 'Card has expired'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV')
});

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
);

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  email: emailSchema
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(
  data => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
).refine(
  data => data.currentPassword !== data.newPassword,
  {
    message: "New password must be different from current password",
    path: ['newPassword']
  }
);

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query is too long'),
  filters: z.record(z.string(), z.any()).optional(),
  ...paginationSchema.shape,
  ...sortSchema.shape
});

/**
 * API response metadata schema
 */
export const apiMetadataSchema = z.object({
  page: positiveIntSchema,
  limit: positiveIntSchema,
  total: nonNegativeIntSchema,
  totalPages: positiveIntSchema
});

/**
 * Environment variables schema
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: portSchema.default(3000),
  DATABASE_URL: z.string().url('Invalid database URL'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  API_KEY: z.string().min(1, 'API key is required').optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info')
});

/**
 * JWT payload schema
 */
export const jwtPayloadSchema = z.object({
  sub: z.string(), // Subject (user ID)
  iat: z.number(), // Issued at
  exp: z.number(), // Expiration time
  email: emailSchema.optional(),
  role: z.string().optional()
});

/**
 * API error schema
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: dateSchema,
  path: z.string().optional()
});

/**
 * Webhook payload schema
 */
export const webhookPayloadSchema = z.object({
  event: z.string().min(1, 'Event type is required'),
  timestamp: dateSchema,
  data: z.record(z.string(), z.any()),
  signature: z.string().optional()
});

/**
 * Rate limit configuration schema
 */
export const rateLimitConfigSchema = z.object({
  windowMs: positiveIntSchema,
  maxRequests: positiveIntSchema,
  message: z.string().optional()
});

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long')
});

/**
 * Social media links schema
 */
export const socialLinksSchema = z.object({
  twitter: urlSchema.optional(),
  facebook: urlSchema.optional(),
  instagram: urlSchema.optional(),
  linkedin: urlSchema.optional(),
  github: urlSchema.optional(),
  website: urlSchema.optional()
});

/**
 * Custom refinements and transformations
 */
export const customRefinements = {
  /**
   * Ensure value is unique in array
   */
  unique: <T>(array: T[]) => (val: T) => !array.includes(val),

  /**
   * Sanitize string input
   */
  sanitize: (val: string) => val.trim().replace(/\s+/g, ' '),

  /**
   * Normalize email
   */
  normalizeEmail: (email: string) => email.toLowerCase().trim(),

  /**
   * Parse JSON string
   */
  parseJSON: (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      throw new Error('Invalid JSON');
    }
  }
};

/**
 * Schema composition helpers
 */
export const schemaHelpers = {
  /**
   * Make all properties optional
   */
  partial: <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.partial(),

  /**
   * Pick specific properties
   */
  pick: <T extends z.ZodRawShape, K extends keyof T>(
    schema: z.ZodObject<T>,
    keys: K[]
  ) => schema.pick(Object.fromEntries(keys.map(k => [k, true])) as any),

  /**
   * Omit specific properties
   */
  omit: <T extends z.ZodRawShape, K extends keyof T>(
    schema: z.ZodObject<T>,
    keys: K[]
  ) => schema.omit(Object.fromEntries(keys.map(k => [k, true])) as any),

  /**
   * Extend schema with additional properties
   */
  extend: <T extends z.ZodRawShape, E extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    extension: E
  ) => schema.extend(extension),

  /**
   * Merge two schemas
   */
  merge: <A extends z.ZodRawShape, B extends z.ZodRawShape>(
    schemaA: z.ZodObject<A>,
    schemaB: z.ZodObject<B>
  ) => schemaA.merge(schemaB)
};

/**
 * Type inference helpers
 */
export type InferSchema<T extends z.ZodType> = z.infer<T>;

// Export commonly used inferred types
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type URL = z.infer<typeof urlSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Address = z.infer<typeof addressSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
