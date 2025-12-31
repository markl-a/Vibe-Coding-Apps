import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthService } from './services/auth.service.js';
import { authMiddleware } from './middleware/auth.middleware.js';

const app = express();
const authService = new AuthService();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register({ email, password });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// Refresh token
app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const tokens = authService.refreshTokens(refreshToken);

  if (!tokens) {
    res.clearCookie('refreshToken');
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Set new refresh token
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  });
});

// Logout
app.post('/auth/logout', authMiddleware, (req, res) => {
  const accessToken = req.headers.authorization?.substring(7) ?? '';
  const refreshToken = req.cookies.refreshToken ?? '';

  authService.logout(accessToken, refreshToken);
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Protected route example
app.get('/auth/me', authMiddleware, (req, res) => {
  const user = authService.getUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 JWT Auth Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  POST /auth/register - Register new user');
  console.log('  POST /auth/login    - Login user');
  console.log('  POST /auth/refresh  - Refresh access token');
  console.log('  POST /auth/logout   - Logout user');
  console.log('  GET  /auth/me       - Get current user (protected)');
});
