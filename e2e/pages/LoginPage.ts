import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

/**
 * Login Page Object Model
 *
 * Encapsulates all interactions with the login page
 */
export class LoginPage extends BasePage {
  // Selectors
  private readonly selectors = {
    emailInput: 'input[type="email"], input[name="email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    loginButton: 'button[type="submit"], button:has-text("Login")',
    errorMessage: '[data-testid="error-message"], .error, .alert-error',
    forgotPasswordLink: 'a:has-text("Forgot Password")',
    signupLink: 'a:has-text("Sign Up")',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/login');
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string): Promise<void> {
    await this.fillInput(this.selectors.emailInput, email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string): Promise<void> {
    await this.fillInput(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.clickElement(this.selectors.loginButton);
  }

  /**
   * Perform complete login
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getTextContent(this.selectors.errorMessage);
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.errorMessage);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.selectors.forgotPasswordLink);
  }

  /**
   * Click signup link
   */
  async clickSignup(): Promise<void> {
    await this.clickElement(this.selectors.signupLink);
  }

  /**
   * Wait for successful login (redirect to dashboard)
   */
  async waitForSuccessfulLogin(): Promise<void> {
    await this.waitForNavigation(/dashboard|home/);
  }
}
