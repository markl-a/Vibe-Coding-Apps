# JWT Auth Server

A secure JWT authentication server implementing best practices for token-based authentication.

## Features

- **Password Security**: bcrypt hashing with configurable salt rounds
- **JWT Tokens**: Short-lived access tokens + long-lived refresh tokens
- **Token Rotation**: Refresh tokens are rotated on each use
- **Token Revocation**: Ability to invalidate tokens
- **HTTP-Only Cookies**: Refresh tokens stored securely
- **Input Validation**: Zod schema validation
- **Password Policy**: Enforced complexity requirements

## Security Best Practices

| Practice | Implementation |
|----------|----------------|
| Password Hashing | bcrypt with 12 salt rounds |
| Access Token Expiry | 15 minutes |
| Refresh Token Expiry | 7 days |
| Token Storage | Access in memory, Refresh in HTTP-only cookie |
| CSRF Protection | SameSite=Strict cookies |
| User Enumeration | Same error for invalid email/password |

## Quick Start

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file:

```env
PORT=3000
ACCESS_TOKEN_SECRET=your-super-secret-access-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Running

```bash
pnpm dev
```

## API Endpoints

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbG...",
  "expiresIn": 900
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  --cookie "refreshToken=..."
```

### Get Current User (Protected)

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbG..."
```

### Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbG..." \
  --cookie "refreshToken=..."
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Client                             │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Auth Middleware                        │
│              (Validates Access Token)                     │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │  Token Service  │ │  User Store     │
│ (Registration,  │ │ (JWT Generate,  │ │ (In-memory,     │
│  Login, Logout) │ │  Verify, Revoke)│ │  use DB in prod)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Token Flow

1. **Login/Register**: Server returns access token + sets refresh token cookie
2. **API Requests**: Client sends access token in Authorization header
3. **Token Refresh**: When access token expires, call `/auth/refresh`
4. **Logout**: Both tokens are revoked

```
Login ──▶ Access Token (15min) + Refresh Token (7d, cookie)
                    │
                    ▼
         Use Access Token for API calls
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   Token Valid?           Token Expired?
         │                     │
         ▼                     ▼
   API Response       Call /auth/refresh
                              │
                              ▼
                     New Access Token
```

## Extending

### Add Database

Replace the in-memory `users` Map with your database:

```typescript
// Using Prisma
const user = await prisma.user.findUnique({
  where: { email }
});
```

### Add Role-Based Access

```typescript
interface User {
  // ...existing fields
  role: 'user' | 'admin';
}

// In middleware
export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.get('/admin', authMiddleware, requireRole('admin'), handler);
```

### Add Rate Limiting

```bash
pnpm add express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts, try again later' }
});

app.post('/auth/login', authLimiter, loginHandler);
```

## Production Checklist

- [ ] Use strong, unique secrets for tokens
- [ ] Use HTTPS in production
- [ ] Store tokens in Redis for revocation
- [ ] Add rate limiting
- [ ] Use a real database
- [ ] Enable secure cookie options
- [ ] Add audit logging
- [ ] Implement account lockout

## Resources

- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)

## License

MIT
