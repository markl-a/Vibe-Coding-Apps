/**
 * Multi-Factor Authentication (MFA) Implementation Example
 *
 * This example demonstrates implementing MFA using:
 * 1. TOTP (Time-based One-Time Passwords) - Google Authenticator compatible
 * 2. Backup codes for account recovery
 * 3. SMS/Email verification codes
 *
 * Security Best Practices:
 * 1. Always hash and encrypt MFA secrets
 * 2. Implement rate limiting on verification attempts
 * 3. Provide backup recovery methods
 * 4. Use constant-time comparison for codes
 * 5. Enforce MFA for privileged accounts
 * 6. Allow users to manage trusted devices
 * 7. Log all MFA events for audit trail
 */

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Type definitions
interface MFASecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  created: Date;
}

interface TOTPConfig {
  name: string;      // App name
  issuer: string;    // Organization name
  window: number;    // Time window for validation (±N periods)
}

interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

/**
 * Multi-Factor Authentication Manager
 * Supports TOTP and backup codes
 */
export class MFAManager {
  private config: TOTPConfig;
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_LENGTH = 6;

  constructor(config: Partial<TOTPConfig> = {}) {
    this.config = {
      name: config.name || 'MyApp',
      issuer: config.issuer || 'MyCompany',
      window: config.window || 1,  // ±30 seconds tolerance
    };
  }

  /**
   * Generate a new TOTP secret for a user
   * This should be done once during MFA setup
   *
   * @param userEmail - User's email address
   * @returns MFA secret with QR code and backup codes
   *
   * SECURITY NOTES:
   * - Secret must be stored encrypted in database
   * - QR code should only be shown once during setup
   * - Backup codes must be hashed before storage
   * - User must confirm setup by entering valid TOTP code
   */
  public async generateTOTPSecret(userEmail: string): Promise<MFASecret> {
    console.log('→ Generating TOTP secret for:', userEmail);

    // Generate secret key
    const secret = speakeasy.generateSecret({
      name: `${this.config.name} (${userEmail})`,
      issuer: this.config.issuer,
      length: 32,  // 32-character base32 encoded secret
    });

    if (!secret.base32) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code URL for easy scanning
    const qrCodeUrl = await this.generateQRCode(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    console.log('✓ TOTP secret generated successfully');
    console.log('  Secret:', secret.base32.substring(0, 10) + '...');
    console.log('  Backup codes generated:', backupCodes.length);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
      created: new Date(),
    };
  }

  /**
   * Generate QR code as data URL
   * User scans this with authenticator app
   *
   * @param otpauthUrl - OTPAuth URL from secret generation
   * @returns QR code as data URL
   */
  private async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      console.log('✓ QR code generated');
      return qrCodeDataUrl;
    } catch (error) {
      console.error('✗ QR code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP code entered by user
   * Used during login or sensitive operations
   *
   * @param secret - User's TOTP secret (from database)
   * @param token - 6-digit code from authenticator app
   * @returns true if valid, false otherwise
   *
   * SECURITY NOTES:
   * - Implement rate limiting (max 3-5 attempts)
   * - Use time window for clock drift tolerance
   * - Log failed attempts for monitoring
   * - Consider using constant-time comparison
   */
  public verifyTOTP(secret: string, token: string): boolean {
    console.log('→ Verifying TOTP code...');

    // Validate token format
    if (!token || token.length !== this.CODE_LENGTH) {
      console.error('✗ Invalid token format');
      return false;
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: this.config.window,  // Allow ±1 time step (30 seconds)
    });

    if (verified) {
      console.log('✓ TOTP code verified successfully');
    } else {
      console.error('✗ TOTP code verification failed');
    }

    return verified;
  }

  /**
   * Generate current TOTP code
   * Useful for testing or displaying current code
   *
   * @param secret - User's TOTP secret
   * @returns Current 6-digit TOTP code
   */
  public generateCurrentTOTP(secret: string): string {
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
    });

    return token;
  }

  /**
   * Generate backup/recovery codes
   * Used when user doesn't have access to authenticator
   *
   * @param count - Number of backup codes to generate
   * @returns Array of backup codes
   *
   * SECURITY NOTES:
   * - Each code should be used only once
   * - Codes should be hashed before storing
   * - Show codes only once during generation
   * - User should store codes securely
   */
  public generateBackupCodes(count: number = 10): string[] {
    console.log('→ Generating backup codes...');

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase();

      // Format: XXXX-XXXX for readability
      const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      codes.push(formattedCode);
    }

    console.log('✓ Generated', count, 'backup codes');
    return codes;
  }

  /**
   * Verify backup code
   * Check if code is valid and not already used
   *
   * @param providedCode - Code entered by user
   * @param storedCodes - Backup codes from database
   * @returns true if valid and unused, false otherwise
   *
   * SECURITY NOTES:
   * - Use constant-time comparison to prevent timing attacks
   * - Mark code as used immediately
   * - Alert user when running low on codes
   * - Regenerate codes after all are used
   */
  public verifyBackupCode(
    providedCode: string,
    storedCodes: BackupCode[]
  ): { valid: boolean; remainingCodes: number } {
    console.log('→ Verifying backup code...');

    // Normalize input (remove spaces, uppercase)
    const normalizedInput = providedCode.replace(/\s/g, '').toUpperCase();

    // Find matching code
    const matchingCode = storedCodes.find(
      (bc) =>
        !bc.used &&
        this.constantTimeCompare(bc.code, normalizedInput)
    );

    if (!matchingCode) {
      console.error('✗ Backup code invalid or already used');
      return {
        valid: false,
        remainingCodes: storedCodes.filter((c) => !c.used).length,
      };
    }

    // Mark as used
    matchingCode.used = true;
    matchingCode.usedAt = new Date();

    const remaining = storedCodes.filter((c) => !c.used).length;
    console.log('✓ Backup code verified successfully');
    console.log('  Remaining codes:', remaining);

    // Warn if running low
    if (remaining <= 2) {
      console.warn('⚠ Warning: Low on backup codes. Generate new ones!');
    }

    return {
      valid: true,
      remainingCodes: remaining,
    };
  }

  /**
   * Constant-time string comparison
   * Prevents timing attacks when comparing secrets
   *
   * @param a - First string
   * @param b - Second string
   * @returns true if equal
   */
  private constantTimeCompare(a: string, b: string): boolean {
    // Use crypto.timingSafeEqual for constant-time comparison
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Hash backup code for storage
   * Never store backup codes in plain text
   *
   * @param code - Backup code to hash
   * @returns Hashed code
   */
  public hashBackupCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }

  /**
   * Generate time-based verification code (for SMS/Email)
   * Alternative to TOTP for users without authenticator apps
   *
   * @param expiryMinutes - Code validity period
   * @returns Verification code object
   *
   * SECURITY NOTES:
   * - Codes should expire quickly (5-10 minutes)
   * - Implement rate limiting on generation
   * - Limit verification attempts
   * - Use secure random number generator
   */
  public generateVerificationCode(expiryMinutes: number = 10): VerificationCode {
    console.log('→ Generating verification code...');

    // Generate 6-digit numeric code
    const code = crypto.randomInt(100000, 999999).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    console.log('✓ Verification code generated');
    console.log('  Code:', code);
    console.log('  Expires at:', expiresAt.toISOString());

    return {
      code,
      expiresAt,
      attempts: 0,
    };
  }

  /**
   * Verify time-based verification code
   *
   * @param providedCode - Code entered by user
   * @param storedCode - Verification code object from storage
   * @returns true if valid, false otherwise
   */
  public verifyVerificationCode(
    providedCode: string,
    storedCode: VerificationCode
  ): boolean {
    console.log('→ Verifying verification code...');

    // Check if code has expired
    if (new Date() > storedCode.expiresAt) {
      console.error('✗ Verification code expired');
      return false;
    }

    // Check attempt limit
    if (storedCode.attempts >= this.MAX_ATTEMPTS) {
      console.error('✗ Too many verification attempts');
      return false;
    }

    // Increment attempts
    storedCode.attempts++;

    // Verify code
    const valid = this.constantTimeCompare(providedCode, storedCode.code);

    if (valid) {
      console.log('✓ Verification code valid');
    } else {
      console.error('✗ Verification code invalid');
      console.log('  Attempts remaining:', this.MAX_ATTEMPTS - storedCode.attempts);
    }

    return valid;
  }
}

/**
 * Example: Complete MFA Setup and Verification Flow
 */
export async function demonstrateMFAFlow() {
  console.log('\n=== Multi-Factor Authentication Example ===\n');

  const mfa = new MFAManager({
    name: 'SecureApp',
    issuer: 'SecureCompany',
    window: 1,
  });

  const userEmail = 'user@example.com';

  // =============================================================================
  // STEP 1: MFA Setup (One-time process)
  // =============================================================================
  console.log('STEP 1: MFA Setup');
  console.log('═════════════════════════════════════════════════════════\n');

  const mfaSecret = await mfa.generateTOTPSecret(userEmail);

  console.log('Setup Instructions for User:');
  console.log('1. Install Google Authenticator or Authy app');
  console.log('2. Scan this QR code:');
  console.log('   QR Code Data URL:', mfaSecret.qrCodeUrl.substring(0, 50) + '...');
  console.log('   OR manually enter secret:', mfaSecret.secret);
  console.log('\n3. Save these backup codes securely:');
  mfaSecret.backupCodes.forEach((code, i) => {
    console.log(`   ${i + 1}. ${code}`);
  });
  console.log('\n');

  // Store in database (encrypted!)
  const storedSecret = mfaSecret.secret;  // Should be encrypted
  const storedBackupCodes: BackupCode[] = mfaSecret.backupCodes.map((code) => ({
    code: mfa.hashBackupCode(code),  // Hash before storing
    used: false,
  }));

  // =============================================================================
  // STEP 2: Verify Setup (User must enter valid code)
  // =============================================================================
  console.log('STEP 2: Verify MFA Setup');
  console.log('═════════════════════════════════════════════════════════\n');

  // Generate current TOTP code (simulating user's authenticator app)
  const currentCode = mfa.generateCurrentTOTP(storedSecret);
  console.log('Current TOTP code from authenticator:', currentCode);

  // Verify the setup
  const setupValid = mfa.verifyTOTP(storedSecret, currentCode);
  if (setupValid) {
    console.log('✓ MFA setup confirmed - user can now use MFA\n');
  } else {
    console.error('✗ MFA setup verification failed\n');
  }

  // =============================================================================
  // STEP 3: Login with MFA (Regular usage)
  // =============================================================================
  console.log('STEP 3: Login with MFA');
  console.log('═════════════════════════════════════════════════════════\n');

  // User enters username/password (first factor)
  console.log('1. User enters credentials: ✓ Valid');
  console.log('2. System requests MFA code...');

  // User enters TOTP code from authenticator
  const loginCode = mfa.generateCurrentTOTP(storedSecret);
  console.log('3. User enters TOTP code:', loginCode);

  const loginValid = mfa.verifyTOTP(storedSecret, loginCode);
  if (loginValid) {
    console.log('✓ MFA verification successful - Login granted\n');
  } else {
    console.error('✗ MFA verification failed - Login denied\n');
  }

  // =============================================================================
  // STEP 4: Login with Backup Code (Authenticator unavailable)
  // =============================================================================
  console.log('STEP 4: Login with Backup Code');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Scenario: User lost phone with authenticator app');
  const backupCodeToUse = mfaSecret.backupCodes[0];
  console.log('User enters backup code:', backupCodeToUse);

  // Hash the provided code to compare with stored hash
  const hashedProvidedCode = mfa.hashBackupCode(backupCodeToUse);

  // Find and verify backup code
  const backupResult = storedBackupCodes.find(
    (bc) => !bc.used && bc.code === hashedProvidedCode
  );

  if (backupResult) {
    backupResult.used = true;
    backupResult.usedAt = new Date();
    console.log('✓ Backup code verified - Login granted');
    console.log('  Remaining backup codes:', storedBackupCodes.filter((c) => !c.used).length);
    console.log('  Recommendation: Generate new backup codes\n');
  } else {
    console.error('✗ Backup code invalid or already used\n');
  }

  // =============================================================================
  // STEP 5: SMS/Email Verification Code (Alternative MFA)
  // =============================================================================
  console.log('STEP 5: SMS/Email Verification Code');
  console.log('═════════════════════════════════════════════════════════\n');

  // Generate verification code
  const smsCode = mfa.generateVerificationCode(10);
  console.log('→ Sending SMS to user:', smsCode.code);
  console.log('  Valid for: 10 minutes\n');

  // Simulate user entering code
  console.log('User enters code:', smsCode.code);
  const smsValid = mfa.verifyVerificationCode(smsCode.code, smsCode);

  if (smsValid) {
    console.log('✓ SMS code verified - Access granted\n');
  } else {
    console.error('✗ SMS code verification failed\n');
  }

  // Test invalid code
  console.log('Testing invalid code:');
  const invalidValid = mfa.verifyVerificationCode('123456', smsCode);
  console.log('');

  // =============================================================================
  // STEP 6: Security Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('MFA Security Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('✓ Encrypt TOTP secrets before storing in database');
  console.log('✓ Hash backup codes (never store plain text)');
  console.log('✓ Implement rate limiting (max 3-5 attempts)');
  console.log('✓ Use constant-time comparison to prevent timing attacks');
  console.log('✓ Set short expiry times for SMS/email codes (5-10 min)');
  console.log('✓ Allow multiple MFA methods (TOTP, SMS, backup codes)');
  console.log('✓ Provide account recovery options');
  console.log('✓ Log all MFA events for audit trail');
  console.log('✓ Alert users of suspicious MFA activity');
  console.log('✓ Enforce MFA for privileged accounts');
  console.log('✓ Support trusted devices to reduce friction');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('=== MFA Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateMFAFlow().catch(console.error);
}
