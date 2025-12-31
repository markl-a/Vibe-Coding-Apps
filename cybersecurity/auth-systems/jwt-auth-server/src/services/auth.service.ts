import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { TokenService } from './token.service.js';
import type { User, AuthTokens, RegisterInput, LoginInput } from '../types.js';

const SALT_ROUNDS = 12;

// Validation schemas
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

// In-memory user store (use database in production)
const users = new Map<string, User>();

export class AuthService {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = new TokenService();
  }

  async register(input: RegisterInput): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Validate input
    const email = emailSchema.parse(input.email.toLowerCase());
    passwordSchema.parse(input.password);

    // Check if user exists
    if (users.has(email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user: User = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(email, user);

    // Generate tokens
    const tokens = this.tokenService.generateTokens(user.id, user.email);

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async login(input: LoginInput): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const email = input.email.toLowerCase();

    // Find user
    const user = users.get(email);
    if (!user) {
      // Use same error for both cases to prevent user enumeration
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.tokenService.generateTokens(user.id, user.email);

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  refreshTokens(refreshToken: string): AuthTokens | null {
    return this.tokenService.refreshAccessToken(refreshToken);
  }

  logout(accessToken: string, refreshToken: string): void {
    this.tokenService.revokeToken(accessToken);
    this.tokenService.revokeToken(refreshToken);
  }

  verifyToken(token: string) {
    return this.tokenService.verifyAccessToken(token);
  }

  getUserById(userId: string): Omit<User, 'passwordHash'> | null {
    for (const user of users.values()) {
      if (user.id === userId) {
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }
}
