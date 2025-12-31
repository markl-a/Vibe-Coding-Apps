/**
 * Secure Session Management Example
 *
 * This example demonstrates implementing secure session handling with:
 * 1. Session creation and validation
 * 2. Session storage (memory, Redis, database)
 * 3. Session security (CSRF protection, session fixation prevention)
 * 4. Session lifecycle management
 * 5. Multi-device session tracking
 *
 * Security Best Practices:
 * 1. Use cryptographically secure session IDs
 * 2. Implement session expiration and idle timeout
 * 3. Regenerate session ID after login (prevent fixation)
 * 4. Use httpOnly and secure cookies
 * 5. Implement CSRF token protection
 * 6. Track and limit active sessions per user
 * 7. Provide session revocation capabilities
 * 8. Log security-relevant session events
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// Type definitions
interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  csrfToken: string;
  mfaVerified: boolean;
  deviceId?: string;
  metadata?: Record<string, any>;
}

interface SessionConfig {
  maxAge: number;           // Session lifetime in milliseconds
  idleTimeout: number;      // Idle timeout in milliseconds
  maxSessionsPerUser: number;
  secureOnly: boolean;      // Require HTTPS
  sameSite: 'strict' | 'lax' | 'none';
  renewalThreshold: number; // Renew session if less than this time remaining
}

interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  getAllForUser(userId: string): Promise<Map<string, SessionData>>;
}

interface DeviceInfo {
  id: string;
  name: string;
  lastUsed: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * In-Memory Session Store (for demonstration)
 * In production, use Redis or a database
 */
class MemorySessionStore implements SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  async get(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, data);

    // Track user's sessions
    if (!this.userSessions.has(data.userId)) {
      this.userSessions.set(data.userId, new Set());
    }
    this.userSessions.get(data.userId)!.add(sessionId);
  }

  async delete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      const userSessionSet = this.userSessions.get(session.userId);
      if (userSessionSet) {
        userSessionSet.delete(sessionId);
      }
    }
  }

  async deleteAll(userId: string): Promise<void> {
    const sessionIds = this.userSessions.get(userId);
    if (sessionIds) {
      sessionIds.forEach((id) => this.sessions.delete(id));
      this.userSessions.delete(userId);
    }
  }

  async getAllForUser(userId: string): Promise<Map<string, SessionData>> {
    const sessionIds = this.userSessions.get(userId) || new Set();
    const userSessionsMap = new Map<string, SessionData>();

    sessionIds.forEach((id) => {
      const session = this.sessions.get(id);
      if (session) {
        userSessionsMap.set(id, session);
      }
    });

    return userSessionsMap;
  }

  // Cleanup expired sessions
  async cleanup(): Promise<number> {
    const now = new Date();
    let deleted = 0;

    this.sessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        this.delete(sessionId);
        deleted++;
      }
    });

    return deleted;
  }
}

/**
 * Secure Session Manager
 */
export class SessionManager extends EventEmitter {
  private store: SessionStore;
  private config: SessionConfig;

  constructor(store?: SessionStore, config?: Partial<SessionConfig>) {
    super();

    this.store = store || new MemorySessionStore();
    this.config = {
      maxAge: config?.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      idleTimeout: config?.idleTimeout || 30 * 60 * 1000, // 30 minutes
      maxSessionsPerUser: config?.maxSessionsPerUser || 5,
      secureOnly: config?.secureOnly ?? true,
      sameSite: config?.sameSite || 'strict',
      renewalThreshold: config?.renewalThreshold || 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Generate a cryptographically secure session ID
   *
   * @returns 32-byte random session ID
   *
   * SECURITY: Use crypto.randomBytes for unpredictability
   * Never use sequential or predictable IDs
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate CSRF token for session
   * Protects against Cross-Site Request Forgery attacks
   *
   * @returns Secure random CSRF token
   */
  private generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session for a user
   *
   * @param userId - User identifier
   * @param email - User email
   * @param role - User role
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @returns Session ID and session data
   *
   * SECURITY NOTES:
   * - Generate new session ID (prevent fixation)
   * - Set appropriate expiration times
   * - Limit sessions per user
   * - Track device/location for anomaly detection
   */
  public async createSession(
    userId: string,
    email: string,
    role: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ sessionId: string; csrfToken: string }> {
    console.log('→ Creating new session for user:', userId);

    // Check session limit
    const existingSessions = await this.store.getAllForUser(userId);
    if (existingSessions.size >= this.config.maxSessionsPerUser) {
      console.warn('⚠ User has maximum sessions, removing oldest');
      await this.removeOldestSession(userId, existingSessions);
    }

    // Generate session ID and CSRF token
    const sessionId = this.generateSessionId();
    const csrfToken = this.generateCSRFToken();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxAge);

    // Create session data
    const sessionData: SessionData = {
      userId,
      email,
      role,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      ipAddress,
      userAgent,
      csrfToken,
      mfaVerified: false,
      deviceId: this.generateDeviceId(userAgent, ipAddress),
    };

    // Store session
    await this.store.set(sessionId, sessionData);

    console.log('✓ Session created successfully');
    console.log('  Session ID:', sessionId.substring(0, 16) + '...');
    console.log('  Expires:', expiresAt.toISOString());

    this.emit('session:created', { sessionId, userId });

    return { sessionId, csrfToken };
  }

  /**
   * Validate and retrieve session
   *
   * @param sessionId - Session ID to validate
   * @param ipAddress - Current client IP
   * @param csrfToken - CSRF token (for state-changing operations)
   * @returns Session data if valid, null otherwise
   *
   * SECURITY CHECKS:
   * 1. Session exists
   * 2. Session not expired
   * 3. Not idle too long
   * 4. IP address matches (optional, can cause issues with mobile)
   * 5. CSRF token matches (for POST/PUT/DELETE)
   */
  public async validateSession(
    sessionId: string,
    ipAddress: string,
    csrfToken?: string
  ): Promise<SessionData | null> {
    console.log('→ Validating session:', sessionId.substring(0, 16) + '...');

    // Retrieve session
    const session = await this.store.get(sessionId);
    if (!session) {
      console.error('✗ Session not found');
      this.emit('session:invalid', { sessionId, reason: 'not_found' });
      return null;
    }

    const now = new Date();

    // Check expiration
    if (session.expiresAt < now) {
      console.error('✗ Session expired');
      await this.destroySession(sessionId);
      this.emit('session:expired', { sessionId, userId: session.userId });
      return null;
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActivity.getTime();
    if (idleTime > this.config.idleTimeout) {
      console.error('✗ Session idle timeout');
      await this.destroySession(sessionId);
      this.emit('session:idle_timeout', { sessionId, userId: session.userId });
      return null;
    }

    // Check IP address (optional - can be strict security requirement)
    // Disabled by default as it can cause issues with mobile networks
    // if (session.ipAddress !== ipAddress) {
    //   console.warn('⚠ IP address changed - possible session hijacking');
    //   this.emit('session:ip_changed', { sessionId, userId: session.userId, oldIp: session.ipAddress, newIp: ipAddress });
    // }

    // Validate CSRF token if provided (required for state-changing operations)
    if (csrfToken !== undefined) {
      if (!this.validateCSRFToken(session, csrfToken)) {
        console.error('✗ CSRF token validation failed');
        this.emit('session:csrf_failed', { sessionId, userId: session.userId });
        return null;
      }
    }

    // Update last activity
    session.lastActivity = now;
    session.ipAddress = ipAddress; // Update to current IP

    // Check if session needs renewal
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    if (timeUntilExpiry < this.config.renewalThreshold) {
      console.log('→ Session near expiry, renewing...');
      session.expiresAt = new Date(now.getTime() + this.config.maxAge);
      this.emit('session:renewed', { sessionId, userId: session.userId });
    }

    await this.store.set(sessionId, session);

    console.log('✓ Session validated successfully');
    return session;
  }

  /**
   * Validate CSRF token
   * Constant-time comparison to prevent timing attacks
   *
   * @param session - Session data
   * @param token - Provided CSRF token
   * @returns true if valid
   */
  private validateCSRFToken(session: SessionData, token: string): boolean {
    if (!session.csrfToken || !token) {
      return false;
    }

    const sessionTokenBuffer = Buffer.from(session.csrfToken);
    const providedTokenBuffer = Buffer.from(token);

    if (sessionTokenBuffer.length !== providedTokenBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sessionTokenBuffer, providedTokenBuffer);
  }

  /**
   * Mark MFA as verified for session
   * Used after successful MFA verification
   *
   * @param sessionId - Session ID
   */
  public async markMFAVerified(sessionId: string): Promise<void> {
    const session = await this.store.get(sessionId);
    if (session) {
      session.mfaVerified = true;
      await this.store.set(sessionId, session);
      console.log('✓ MFA verified for session');
      this.emit('session:mfa_verified', { sessionId, userId: session.userId });
    }
  }

  /**
   * Regenerate session ID (after login/privilege escalation)
   * Prevents session fixation attacks
   *
   * @param oldSessionId - Current session ID
   * @returns New session ID
   *
   * SECURITY: Always regenerate session ID after authentication
   */
  public async regenerateSessionId(oldSessionId: string): Promise<string> {
    console.log('→ Regenerating session ID...');

    const session = await this.store.get(oldSessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Generate new session ID
    const newSessionId = this.generateSessionId();

    // Delete old session
    await this.store.delete(oldSessionId);

    // Store with new ID
    await this.store.set(newSessionId, session);

    console.log('✓ Session ID regenerated');
    console.log('  Old ID:', oldSessionId.substring(0, 16) + '...');
    console.log('  New ID:', newSessionId.substring(0, 16) + '...');

    this.emit('session:regenerated', {
      oldSessionId,
      newSessionId,
      userId: session.userId,
    });

    return newSessionId;
  }

  /**
   * Destroy a session (logout)
   *
   * @param sessionId - Session ID to destroy
   */
  public async destroySession(sessionId: string): Promise<void> {
    console.log('→ Destroying session:', sessionId.substring(0, 16) + '...');

    const session = await this.store.get(sessionId);
    await this.store.delete(sessionId);

    console.log('✓ Session destroyed');

    if (session) {
      this.emit('session:destroyed', { sessionId, userId: session.userId });
    }
  }

  /**
   * Destroy all sessions for a user (logout all devices)
   *
   * @param userId - User ID
   */
  public async destroyAllSessions(userId: string): Promise<void> {
    console.log('→ Destroying all sessions for user:', userId);

    await this.store.deleteAll(userId);

    console.log('✓ All sessions destroyed');
    this.emit('session:destroyed_all', { userId });
  }

  /**
   * Get all active sessions for a user
   * Used for "active devices" management
   *
   * @param userId - User ID
   * @returns List of active sessions
   */
  public async getUserSessions(userId: string): Promise<DeviceInfo[]> {
    const sessions = await this.store.getAllForUser(userId);
    const devices: DeviceInfo[] = [];

    sessions.forEach((session, sessionId) => {
      devices.push({
        id: sessionId,
        name: this.getDeviceName(session.userAgent),
        lastUsed: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
    });

    return devices.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  /**
   * Generate device ID from user agent and IP
   * Used for device tracking
   */
  private generateDeviceId(userAgent: string, ipAddress: string): string {
    return crypto
      .createHash('sha256')
      .update(userAgent + ipAddress)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Extract device name from user agent
   */
  private getDeviceName(userAgent: string): string {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  }

  /**
   * Remove oldest session when user reaches session limit
   */
  private async removeOldestSession(
    userId: string,
    sessions: Map<string, SessionData>
  ): Promise<void> {
    let oldestSessionId: string | null = null;
    let oldestTime = Date.now();

    sessions.forEach((session, sessionId) => {
      if (session.lastActivity.getTime() < oldestTime) {
        oldestTime = session.lastActivity.getTime();
        oldestSessionId = sessionId;
      }
    });

    if (oldestSessionId) {
      await this.destroySession(oldestSessionId);
      console.log('  Removed oldest session:', oldestSessionId.substring(0, 16) + '...');
    }
  }

  /**
   * Get session cookie options
   * Use these when setting cookies in HTTP responses
   */
  public getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  } {
    return {
      httpOnly: true,  // Prevent JavaScript access
      secure: this.config.secureOnly,  // HTTPS only
      sameSite: this.config.sameSite,  // CSRF protection
      maxAge: this.config.maxAge,
    };
  }
}

/**
 * Example: Complete Session Management Workflow
 */
export async function demonstrateSessionManagement() {
  console.log('\n=== Secure Session Management Example ===\n');

  const sessionManager = new SessionManager(new MemorySessionStore(), {
    maxAge: 60 * 60 * 1000,        // 1 hour
    idleTimeout: 15 * 60 * 1000,   // 15 minutes
    maxSessionsPerUser: 3,
    secureOnly: true,
    sameSite: 'strict',
  });

  // Listen to session events
  sessionManager.on('session:created', (data) => {
    console.log('  [EVENT] Session created:', data.userId);
  });
  sessionManager.on('session:expired', (data) => {
    console.log('  [EVENT] Session expired:', data.userId);
  });

  const userId = 'user123';
  const email = 'user@example.com';
  const role = 'admin';
  const ipAddress = '192.168.1.100';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

  // 1. Login - Create session
  console.log('Step 1: User Login - Create Session');
  console.log('═════════════════════════════════════════════════════════\n');

  const { sessionId, csrfToken } = await sessionManager.createSession(
    userId,
    email,
    role,
    ipAddress,
    userAgent
  );

  console.log('→ Set session cookie:');
  console.log('  Cookie Options:', JSON.stringify(sessionManager.getCookieOptions(), null, 2));
  console.log('');

  // 2. Validate session (API request)
  console.log('Step 2: Validate Session (API Request)');
  console.log('═════════════════════════════════════════════════════════\n');

  let session = await sessionManager.validateSession(sessionId, ipAddress);
  if (session) {
    console.log('✓ User authenticated:', session.email);
    console.log('  Role:', session.role);
    console.log('  MFA Verified:', session.mfaVerified);
    console.log('');
  }

  // 3. MFA Verification
  console.log('Step 3: MFA Verification');
  console.log('═════════════════════════════════════════════════════════\n');

  await sessionManager.markMFAVerified(sessionId);
  session = await sessionManager.validateSession(sessionId, ipAddress);
  console.log('✓ MFA status updated:', session?.mfaVerified);
  console.log('');

  // 4. CSRF-protected operation
  console.log('Step 4: CSRF-Protected Operation (POST/PUT/DELETE)');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Valid CSRF token:');
  session = await sessionManager.validateSession(sessionId, ipAddress, csrfToken);
  console.log('  Result:', session ? '✓ Valid' : '✗ Invalid');
  console.log('');

  console.log('Invalid CSRF token:');
  session = await sessionManager.validateSession(sessionId, ipAddress, 'wrong-token');
  console.log('  Result:', session ? '✓ Valid' : '✗ Invalid');
  console.log('');

  // 5. Session regeneration (after privilege escalation)
  console.log('Step 5: Session Regeneration (Prevent Fixation)');
  console.log('═════════════════════════════════════════════════════════\n');

  const newSessionId = await sessionManager.regenerateSessionId(sessionId);
  console.log('→ Update session cookie with new ID\n');

  // 6. Multiple devices
  console.log('Step 6: Multiple Device Management');
  console.log('═════════════════════════════════════════════════════════\n');

  // Create sessions from different devices
  await sessionManager.createSession(
    userId,
    email,
    role,
    '192.168.1.101',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  );

  await sessionManager.createSession(
    userId,
    email,
    role,
    '192.168.1.102',
    'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
  );

  const devices = await sessionManager.getUserSessions(userId);
  console.log('Active devices for user:');
  devices.forEach((device, i) => {
    console.log(`  ${i + 1}. ${device.name}`);
    console.log(`     Last used: ${device.lastUsed.toISOString()}`);
    console.log(`     IP: ${device.ipAddress}`);
  });
  console.log('');

  // 7. Logout single device
  console.log('Step 7: Logout Single Device');
  console.log('═════════════════════════════════════════════════════════\n');

  await sessionManager.destroySession(newSessionId);
  console.log('');

  // 8. Logout all devices
  console.log('Step 8: Logout All Devices (Security Action)');
  console.log('═════════════════════════════════════════════════════════\n');

  await sessionManager.destroyAllSessions(userId);
  console.log('');

  // 9. Security summary
  console.log('═════════════════════════════════════════════════════════');
  console.log('Session Security Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('✓ Cryptographically secure session IDs (32 bytes random)');
  console.log('✓ Session expiration (max age) and idle timeout');
  console.log('✓ Session regeneration after login (prevents fixation)');
  console.log('✓ httpOnly cookies (prevents XSS attacks)');
  console.log('✓ Secure flag for HTTPS-only transmission');
  console.log('✓ SameSite attribute for CSRF protection');
  console.log('✓ CSRF token validation for state-changing operations');
  console.log('✓ Session limit per user (max devices)');
  console.log('✓ Multi-device session tracking and management');
  console.log('✓ Event logging for security monitoring');
  console.log('✓ IP address tracking (optional strict mode)');
  console.log('✓ MFA verification tracking');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('=== Session Management Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateSessionManagement().catch(console.error);
}
