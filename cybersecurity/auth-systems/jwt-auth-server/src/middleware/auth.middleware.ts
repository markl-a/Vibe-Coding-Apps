import type { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';
import type { TokenPayload } from '../types.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const tokenService = new TokenService();

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  const payload = tokenService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach user to request
  req.user = payload;
  next();
}

// Optional: Role-based authorization
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Add role checking logic here
    // For now, just continue
    next();
  };
}
