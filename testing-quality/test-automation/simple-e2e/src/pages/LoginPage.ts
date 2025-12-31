import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Login Page Object
 *
 * Encapsulates all interactions with the login page.
 */
export class LoginPage extends BasePage {
  readonly url = '/login';

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly socialLoginGoogle: Locator;
  readonly socialLoginGithub: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.signUpLink = page.locator('[data-testid="signup-link"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"]');
    this.socialLoginGoogle = page.locator('[data-testid="google-login"]');
    this.socialLoginGithub = page.locator('[data-testid="github-login"]');
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.safeFill(this.emailInput, email);
    await this.safeFill(this.passwordInput, password);
    await this.safeClick(this.loginButton);
    await this.waitForPageLoad();
  }

  /**
   * Login with remember me option
   */
  async loginWithRememberMe(email: string, password: string): Promise<void> {
    await this.safeFill(this.emailInput, email);
    await this.safeFill(this.passwordInput, password);
    await this.rememberMeCheckbox.check();
    await this.safeClick(this.loginButton);
    await this.waitForPageLoad();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return this.getText(this.errorMessage);
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword(): Promise<void> {
    await this.safeClick(this.forgotPasswordLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to sign up
   */
  async goToSignUp(): Promise<void> {
    await this.safeClick(this.signUpLink);
    await this.waitForPageLoad();
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<void> {
    await this.safeClick(this.socialLoginGoogle);
  }

  /**
   * Login with GitHub
   */
  async loginWithGithub(): Promise<void> {
    await this.safeClick(this.socialLoginGithub);
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
