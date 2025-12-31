import jwt from 'jsonwebtoken';
import type { TokenPayload, AuthTokens } from '../types.js';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// In-memory revoked tokens (use Redis in production)
const revokedTokens = new Set<string>();

export class TokenService {
  generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, email, type: 'access' } as TokenPayload,
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' } as TokenPayload,
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      if (revokedTokens.has(token)) {
        return null;
      }
      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
      if (payload.type !== 'access') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      if (revokedTokens.has(token)) {
        return null;
      }
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
      if (payload.type !== 'refresh') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  revokeToken(token: string): void {
    revokedTokens.add(token);
  }

  isRevoked(token: string): boolean {
    return revokedTokens.has(token);
  }

  // Refresh access token using refresh token
  refreshAccessToken(refreshToken: string): AuthTokens | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Revoke old refresh token (rotation)
    this.revokeToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(payload.userId, payload.email);
  }
}
