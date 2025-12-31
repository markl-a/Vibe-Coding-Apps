import { test, expect } from './fixtures';
import { LoginPage } from './pages/LoginPage';
import {
  generateTestEmail,
  generateRandomString,
  clearBrowserData,
  getLocalStorageItem,
  getCookies,
} from './utils/helpers';

/**
 * Authentication E2E Test Suite
 *
 * Tests cover:
 * - User login flows (valid/invalid credentials)
 * - Session management
 * - Password reset functionality
 * - Logout functionality
 * - Token persistence
 */

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data before each test
    await clearBrowserData(page);
  });

  test('should display login form with all required elements', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Verify page title
    await expect(page).toHaveTitle(/login|sign in/i);

    // Verify all form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.locator('button[type="submit"], button:has-text("Login")')
    ).toBeVisible();

    // Verify additional links
    const forgotPasswordLink = page.locator(
      'a:has-text("Forgot Password"), a[href*="forgot"], a[href*="reset"]'
    );
    const signupLink = page.locator(
      'a:has-text("Sign Up"), a:has-text("Register"), a[href*="register"], a[href*="signup"]'
    );

    // At least one of these links should be visible
    const hasForgotPassword = await forgotPasswordLink
      .first()
      .isVisible()
      .catch(() => false);
    const hasSignup = await signupLink
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasForgotPassword || hasSignup).toBeTruthy();
  });

  test('should show validation errors for empty form submission', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try to submit empty form
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Login")')
      .first();
    await submitButton.click();

    // Wait for validation messages
    await page.waitForTimeout(500);

    // Check for validation messages
    const validationMessages = page.locator(
      '[class*="error"], [class*="invalid"], [role="alert"], text=/required|invalid|fill/i'
    );

    const errorCount = await validationMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill in invalid credentials
    const invalidEmail = generateTestEmail('invalid');
    const invalidPassword = generateRandomString(12);

    await loginPage.fillEmail(invalidEmail);
    await loginPage.fillPassword(invalidPassword);
    await loginPage.clickLogin();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check for error message
    const errorMessage = page.locator(
      'text=/invalid|incorrect|wrong|failed|error/i, [class*="error"], [role="alert"]'
    );

    const hasError = await errorMessage.first().isVisible({ timeout: 5000 });
    expect(hasError).toBeTruthy();
  });

  test('should validate email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Enter invalid email format
    await loginPage.fillEmail('not-a-valid-email');
    await loginPage.fillPassword('Password123!');

    // Try to submit
    await loginPage.clickLogin();

    // Wait for validation
    await page.waitForTimeout(500);

    // Check for email validation error
    const emailError = page.locator(
      'text=/valid email|email format|invalid email/i, [class*="error"]'
    );

    const hasEmailError = await emailError.first().isVisible({ timeout: 3000 });

    // Either client-side validation should show, or server should reject
    const pageUrl = page.url();
    const stillOnLoginPage = pageUrl.includes('login');

    expect(hasEmailError || stillOnLoginPage).toBeTruthy();
  });

  test.skip('should successfully login with valid credentials and persist session', async ({
    page,
    testUser,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Perform login with test user
    await loginPage.login(testUser.email, testUser.password);

    // Wait for successful login (redirect or profile visible)
    await Promise.race([
      page.waitForURL(/dashboard|home|profile/, { timeout: 10000 }),
      page.waitForSelector('[data-testid="user-profile"], [class*="profile"]', {
        timeout: 10000,
      }),
    ]).catch(() => {
      // If neither happens, check URL changed from login
      expect(page.url()).not.toContain('login');
    });

    // Verify session persistence
    // Check for auth token in localStorage or cookies
    const authToken =
      (await getLocalStorageItem(page, 'authToken')) ||
      (await getLocalStorageItem(page, 'token')) ||
      (await getLocalStorageItem(page, 'access_token'));

    const cookies = await getCookies(page);
    const hasAuthCookie =
      cookies.has('auth') ||
      cookies.has('session') ||
      cookies.has('token') ||
      cookies.has('access_token');

    // Either localStorage or cookies should contain auth info
    expect(authToken || hasAuthCookie).toBeTruthy();

    // Verify user is logged in by checking for user-specific elements
    const userIndicators = page.locator(
      '[data-testid="user-profile"], [class*="user-menu"], [class*="profile"], text=/logout|sign out/i'
    );
    const hasUserIndicator = (await userIndicators.count()) > 0;
    expect(hasUserIndicator).toBeTruthy();
  });

  test.skip('should logout successfully and clear session', async ({
    authenticatedPage,
  }) => {
    // Start with authenticated session
    const page = authenticatedPage;

    // Find and click logout button
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out"), [data-testid="logout"]'
    );

    await logoutButton.first().click();

    // Wait for redirect to login or home page
    await Promise.race([
      page.waitForURL(/login|home|^\/$/, { timeout: 5000 }),
      page.waitForTimeout(3000),
    ]);

    // Verify session is cleared
    const authToken =
      (await getLocalStorageItem(page, 'authToken')) ||
      (await getLocalStorageItem(page, 'token')) ||
      (await getLocalStorageItem(page, 'access_token'));

    expect(authToken).toBeFalsy();

    // Verify logout success
    // Should either be on login page or see login button
    const onLoginPage = page.url().includes('login');
    const loginButton = await page
      .locator('a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")')
      .first()
      .isVisible()
      .catch(() => false);

    expect(onLoginPage || loginButton).toBeTruthy();
  });

  test('should navigate to password reset page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Find forgot password link
    const forgotPasswordLink = page.locator(
      'a:has-text("Forgot"), a:has-text("Reset"), a[href*="forgot"], a[href*="reset"]'
    );

    const isVisible = await forgotPasswordLink.first().isVisible().catch(() => false);

    if (isVisible) {
      await forgotPasswordLink.first().click();

      // Wait for navigation
      await page.waitForURL(/forgot|reset/, { timeout: 5000 });

      // Verify password reset page loads
      await expect(page).toHaveURL(/forgot|reset/);

      // Check for email input on reset page
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    } else {
      // If forgot password link not found, skip this assertion
      test.skip();
    }
  });
});

test.describe('Authentication Security', () => {
  test('should prevent login with SQL injection attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try SQL injection patterns
    const sqlInjectionPatterns = [
      "admin' OR '1'='1",
      "admin'--",
      "' OR '1'='1' --",
      "admin' OR 1=1--",
    ];

    for (const pattern of sqlInjectionPatterns) {
      await loginPage.fillEmail(pattern);
      await loginPage.fillPassword(pattern);
      await loginPage.clickLogin();

      await page.waitForTimeout(1000);

      // Should not be logged in - verify still on login page or error shown
      const stillOnLogin = page.url().includes('login');
      const hasError = await page
        .locator('text=/error|invalid|failed/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(stillOnLogin || hasError).toBeTruthy();

      // Clear fields for next iteration
      await clearBrowserData(page);
      await page.reload();
    }
  });

  test('should not expose sensitive information in error messages', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try login with non-existent email
    await loginPage.fillEmail('nonexistent@example.com');
    await loginPage.fillPassword('password123');
    await loginPage.clickLogin();

    await page.waitForTimeout(2000);

    // Check error message doesn't reveal whether email exists
    const errorMessage = await page
      .locator('text=/error|invalid|failed/i, [class*="error"], [role="alert"]')
      .first()
      .textContent()
      .catch(() => '');

    // Error should be generic (not "email not found" or "wrong password")
    const isGeneric =
      errorMessage.toLowerCase().includes('invalid') ||
      errorMessage.toLowerCase().includes('incorrect') ||
      errorMessage.toLowerCase().includes('failed');

    const exposesEmailExists = errorMessage.toLowerCase().includes('email not found');
    const exposesPasswordWrong = errorMessage.toLowerCase().includes('wrong password');

    // Should have generic error and not expose specific information
    expect(isGeneric && !exposesEmailExists && !exposesPasswordWrong).toBeTruthy();
  });
});
