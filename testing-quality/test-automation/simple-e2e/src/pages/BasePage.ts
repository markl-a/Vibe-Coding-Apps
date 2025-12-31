import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object
 *
 * This class provides common functionality for all page objects:
 * - Navigation helpers
 * - Wait utilities
 * - Screenshot capture
 * - Element interaction wrappers
 */
export abstract class BasePage {
  readonly page: Page;
  abstract readonly url: string;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Take a screenshot with optional name
   */
  async screenshot(name?: string): Promise<Buffer> {
    return this.page.screenshot({
      path: name ? `screenshots/${name}.png` : undefined,
      fullPage: true,
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout = 5000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Safe click with retry
   */
  async safeClick(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? 5000 });
    await locator.click();
  }

  /**
   * Safe fill with clear
   */
  async safeFill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /**
   * Get text content of element
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  /**
   * Assert element has text
   */
  async assertHasText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  /**
   * Assert element is visible
   */
  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert URL contains path
   */
  async assertUrlContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
