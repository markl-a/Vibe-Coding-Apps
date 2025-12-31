/**
 * JWT Authentication Server
 *
 * A secure authentication system with:
 * - Password hashing with bcrypt
 * - JWT access and refresh tokens
 * - Token rotation and revocation
 * - Rate limiting ready
 */

export { AuthService } from './services/auth.service.js';
export { TokenService } from './services/token.service.js';
export { authMiddleware } from './middleware/auth.middleware.js';
export type { User, TokenPayload, AuthTokens } from './types.js';
