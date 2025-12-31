/**
 * OAuth 2.0 Authorization Flow Example
 *
 * This example demonstrates implementing OAuth 2.0 authorization code flow
 * with PKCE (Proof Key for Code Exchange) for enhanced security.
 *
 * OAuth 2.0 Flow Overview:
 * 1. Client redirects user to authorization server
 * 2. User authenticates and grants permissions
 * 3. Authorization server redirects back with authorization code
 * 4. Client exchanges code for access token
 * 5. Client uses access token to access protected resources
 *
 * Security Best Practices:
 * 1. Always use PKCE for public clients (SPAs, mobile apps)
 * 2. Validate redirect URIs strictly
 * 3. Use state parameter to prevent CSRF attacks
 * 4. Implement secure token storage
 * 5. Use short-lived access tokens with refresh tokens
 * 6. Validate all responses from authorization server
 */

import crypto from 'crypto';
import { URLSearchParams } from 'url';

// Type definitions
interface OAuthConfig {
  clientId: string;
  clientSecret?: string;  // Not used with PKCE for public clients
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string[];
}

interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

interface AuthorizationRequest {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;  // Store securely for token exchange
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

interface AuthorizationCode {
  code: string;
  state: string;
}

/**
 * OAuth 2.0 Client implementing Authorization Code Flow with PKCE
 */
export class OAuth2Client {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate OAuth configuration
   */
  private validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error('Client ID is required');
    }
    if (!this.config.authorizationEndpoint) {
      throw new Error('Authorization endpoint is required');
    }
    if (!this.config.tokenEndpoint) {
      throw new Error('Token endpoint is required');
    }
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI is required');
    }
  }

  /**
   * Generate a cryptographically secure random string
   * Used for state and code verifier
   *
   * @param length - Length of random string (default: 32)
   * @returns Base64 URL-encoded random string
   */
  private generateRandomString(length: number = 32): string {
    return crypto
      .randomBytes(length)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE challenge from code verifier
   * PKCE prevents authorization code interception attacks
   *
   * @param codeVerifier - Random string (43-128 characters)
   * @returns PKCE challenge object
   *
   * SECURITY: Use S256 (SHA-256) method, not plain
   */
  private generatePKCEChallenge(codeVerifier: string): PKCEChallenge {
    // SHA-256 hash of code verifier
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64');

    // Convert to URL-safe base64
    const codeChallenge = hash
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  /**
   * Step 1: Build authorization URL and redirect user
   * User will be redirected to OAuth provider for authentication
   *
   * @returns Authorization request with URL, state, and code verifier
   *
   * SECURITY NOTES:
   * - State parameter prevents CSRF attacks - verify on callback
   * - Code verifier must be stored securely for token exchange
   * - Never send code verifier to authorization server
   */
  public buildAuthorizationUrl(): AuthorizationRequest {
    // Generate state for CSRF protection
    const state = this.generateRandomString(32);

    // Generate PKCE parameters
    const codeVerifier = this.generateRandomString(64);
    const pkce = this.generatePKCEChallenge(codeVerifier);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state: state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
    });

    const authorizationUrl = `${this.config.authorizationEndpoint}?${params.toString()}`;

    console.log('✓ Authorization URL generated');
    console.log('  State:', state);
    console.log('  Code Challenge:', pkce.codeChallenge);

    return {
      authorizationUrl,
      state,
      codeVerifier,  // IMPORTANT: Store this securely (session/localStorage)
    };
  }

  /**
   * Step 2: Handle authorization callback
   * Validates state and extracts authorization code
   *
   * @param callbackUrl - Full callback URL with query parameters
   * @param expectedState - State value from authorization request
   * @returns Authorization code
   *
   * SECURITY: Always validate state to prevent CSRF attacks
   */
  public handleCallback(callbackUrl: string, expectedState: string): AuthorizationCode {
    const url = new URL(callbackUrl);
    const params = new URLSearchParams(url.search);

    // Extract parameters
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Check for errors from authorization server
    if (error) {
      console.error('✗ Authorization error:', error);
      console.error('  Description:', errorDescription);
      throw new Error(`Authorization failed: ${error} - ${errorDescription}`);
    }

    // Validate required parameters
    if (!code) {
      throw new Error('Authorization code not received');
    }

    if (!state) {
      throw new Error('State parameter not received');
    }

    // CRITICAL: Validate state to prevent CSRF
    if (state !== expectedState) {
      console.error('✗ State mismatch - possible CSRF attack');
      throw new Error('Invalid state parameter - CSRF protection triggered');
    }

    console.log('✓ Callback validated successfully');
    console.log('  Authorization code received');

    return { code, state };
  }

  /**
   * Step 3: Exchange authorization code for access token
   * This completes the OAuth flow
   *
   * @param code - Authorization code from callback
   * @param codeVerifier - Code verifier from authorization request
   * @returns Token response with access and refresh tokens
   *
   * SECURITY:
   * - Send code verifier to prove we initiated the request
   * - Use HTTPS for all token requests
   * - Never log or expose tokens
   */
  public async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    // Build token request parameters
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier,  // PKCE verification
    });

    // Add client secret if available (confidential clients)
    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    console.log('→ Exchanging authorization code for token...');

    try {
      // Make token request
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('✗ Token exchange failed:', response.status);
        console.error('  Error:', errorData);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();

      // Parse token response
      const tokenResponse: TokenResponse = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };

      console.log('✓ Access token received');
      console.log('  Token Type:', tokenResponse.tokenType);
      console.log('  Expires In:', tokenResponse.expiresIn, 'seconds');
      console.log('  Refresh Token:', tokenResponse.refreshToken ? 'Yes' : 'No');

      return tokenResponse;
    } catch (error) {
      console.error('✗ Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Used when access token expires
   *
   * @param refreshToken - Valid refresh token
   * @returns New token response
   *
   * SECURITY:
   * - Implement token rotation (new refresh token on refresh)
   * - Invalidate old refresh token
   * - Detect and block refresh token reuse
   */
  public async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    console.log('→ Refreshing access token...');

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('✗ Token refresh failed:', response.status);
        throw new Error(`Token refresh failed: ${errorData.error || response.status}`);
      }

      const data = await response.json();

      const tokenResponse: TokenResponse = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,  // Might not rotate
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };

      console.log('✓ Access token refreshed successfully');
      return tokenResponse;
    } catch (error) {
      console.error('✗ Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request with access token
   *
   * @param url - API endpoint URL
   * @param accessToken - Valid access token
   * @param options - Fetch options
   * @returns API response
   */
  public async makeAuthenticatedRequest(
    url: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Add authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    console.log(`→ Making authenticated request to ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.error('✗ Access token expired or invalid');
        throw new Error('Token expired - refresh needed');
      }

      console.log('✓ Request successful:', response.status);
      return response;
    } catch (error) {
      console.error('✗ Request failed:', error);
      throw error;
    }
  }

  /**
   * Revoke token (logout)
   *
   * @param token - Token to revoke (access or refresh)
   * @param tokenTypeHint - Type of token ('access_token' or 'refresh_token')
   */
  public async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<void> {
    // Most OAuth providers have a revocation endpoint
    const revocationEndpoint = this.config.tokenEndpoint.replace('/token', '/revoke');

    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    console.log('→ Revoking token...');

    try {
      const response = await fetch(revocationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (response.ok) {
        console.log('✓ Token revoked successfully');
      } else {
        console.warn('⚠ Token revocation failed (may not be supported)');
      }
    } catch (error) {
      console.error('✗ Token revocation error:', error);
    }
  }
}

/**
 * Example: Complete OAuth 2.0 Flow Demonstration
 */
export async function demonstrateOAuthFlow() {
  console.log('\n=== OAuth 2.0 Authorization Code Flow with PKCE ===\n');

  // Configuration (example with GitHub OAuth)
  const config: OAuthConfig = {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',  // Optional with PKCE
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    redirectUri: 'http://localhost:3000/callback',
    scope: ['read:user', 'user:email'],
  };

  const client = new OAuth2Client(config);

  // Step 1: Build authorization URL
  console.log('Step 1: Build Authorization URL');
  console.log('─────────────────────────────────');
  const authRequest = client.buildAuthorizationUrl();
  console.log('Authorization URL:', authRequest.authorizationUrl);
  console.log('\n→ Redirect user to this URL for authentication\n');

  // Store these securely (in session)
  const storedState = authRequest.state;
  const storedCodeVerifier = authRequest.codeVerifier;

  // Step 2: Handle callback (after user authenticates)
  console.log('Step 2: Handle OAuth Callback');
  console.log('─────────────────────────────────');
  // Simulated callback URL (would come from OAuth provider)
  const callbackUrl = `http://localhost:3000/callback?code=example_auth_code_12345&state=${storedState}`;

  try {
    const authCode = client.handleCallback(callbackUrl, storedState);
    console.log('Authorization Code:', authCode.code.substring(0, 20) + '...\n');

    // Step 3: Exchange code for token (mocked - would require real OAuth server)
    console.log('Step 3: Exchange Code for Token');
    console.log('─────────────────────────────────');
    console.log('Note: This step requires a real OAuth server');
    console.log('In production, this would:');
    console.log('  1. Send code + code_verifier to token endpoint');
    console.log('  2. Receive access_token and refresh_token');
    console.log('  3. Store tokens securely\n');

    // Simulated token response
    const mockTokens: TokenResponse = {
      accessToken: 'gho_example_access_token_abc123',
      refreshToken: 'gho_example_refresh_token_xyz789',
      expiresIn: 3600,
      tokenType: 'Bearer',
      scope: 'read:user,user:email',
    };

    console.log('✓ Mock tokens received:');
    console.log('  Access Token:', mockTokens.accessToken.substring(0, 30) + '...');
    console.log('  Refresh Token:', mockTokens.refreshToken?.substring(0, 30) + '...');
    console.log('  Expires In:', mockTokens.expiresIn, 'seconds\n');

    // Step 4: Use access token for API requests
    console.log('Step 4: Make Authenticated API Request');
    console.log('─────────────────────────────────');
    console.log('Using access token to call protected APIs');
    console.log('Example: GET https://api.github.com/user');
    console.log('Header: Authorization: Bearer ' + mockTokens.accessToken.substring(0, 20) + '...\n');

    // Step 5: Token refresh (when access token expires)
    console.log('Step 5: Refresh Access Token');
    console.log('─────────────────────────────────');
    console.log('When access token expires, use refresh token');
    console.log('This would exchange refresh token for new access token\n');

    // Step 6: Revoke tokens (logout)
    console.log('Step 6: Revoke Tokens (Logout)');
    console.log('─────────────────────────────────');
    console.log('On logout, revoke both access and refresh tokens');
    console.log('This invalidates the tokens on the server\n');

  } catch (error) {
    console.error('OAuth flow error:', error);
  }

  console.log('=== OAuth Flow Complete ===\n');
  console.log('Security Checklist:');
  console.log('✓ PKCE prevents authorization code interception');
  console.log('✓ State parameter prevents CSRF attacks');
  console.log('✓ Short-lived access tokens limit exposure');
  console.log('✓ Refresh token rotation prevents replay attacks');
  console.log('✓ Token revocation enables proper logout');
  console.log('✓ HTTPS required for all OAuth communications\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateOAuthFlow().catch(console.error);
}
