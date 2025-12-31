import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Home Page Object
 *
 * Encapsulates all interactions with the home page.
 * Uses the Page Object Pattern for maintainable tests.
 */
export class HomePage extends BasePage {
  readonly url = '/';

  // Locators
  readonly header: Locator;
  readonly logo: Locator;
  readonly navLinks: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly loginLink: Locator;
  readonly signUpButton: Locator;
  readonly heroTitle: Locator;
  readonly heroDescription: Locator;
  readonly featuresSection: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.header = page.locator('header');
    this.logo = page.locator('[data-testid="logo"]');
    this.navLinks = page.locator('nav a');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.loginLink = page.locator('[data-testid="login-link"]');
    this.signUpButton = page.locator('[data-testid="signup-button"]');
    this.heroTitle = page.locator('h1');
    this.heroDescription = page.locator('[data-testid="hero-description"]');
    this.featuresSection = page.locator('[data-testid="features"]');
  }

  /**
   * Search for a term
   */
  async search(term: string): Promise<void> {
    await this.safeFill(this.searchInput, term);
    await this.safeClick(this.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to login page
   */
  async goToLogin(): Promise<void> {
    await this.safeClick(this.loginLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to sign up
   */
  async goToSignUp(): Promise<void> {
    await this.safeClick(this.signUpButton);
    await this.waitForPageLoad();
  }

  /**
   * Get navigation link count
   */
  async getNavLinkCount(): Promise<number> {
    return this.navLinks.count();
  }

  /**
   * Click navigation link by text
   */
  async clickNavLink(text: string): Promise<void> {
    await this.page.locator(`nav a:has-text("${text}")`).click();
    await this.waitForPageLoad();
  }

  /**
   * Check if hero section is visible
   */
  async isHeroVisible(): Promise<boolean> {
    return this.heroTitle.isVisible();
  }

  /**
   * Get hero title text
   */
  async getHeroTitle(): Promise<string> {
    return this.getText(this.heroTitle);
  }
}
