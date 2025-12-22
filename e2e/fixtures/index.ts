import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Test Fixtures
 *
 * Fixtures are used to establish test environment and reusable test helpers.
 * They provide a way to share setup/teardown code and page objects across tests.
 */

// Define custom test user types
export type TestUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

// Define test context with custom fixtures
export type TestFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Test user fixture - provides a test user for authentication tests
   */
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    };
    await use(user);
  },

  /**
   * Authenticated page fixture - provides a page with an authenticated session
   * This is useful for tests that require a logged-in user
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Perform login
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Wait for successful login (adjust selector based on your app)
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      // If no redirect, check for auth token or user profile
      return page.waitForSelector('[data-testid="user-profile"]', {
        timeout: 5000,
      });
    });

    // Use the authenticated page
    await use(page);

    // Cleanup: logout after test
    // await page.click('[data-testid="logout-button"]').catch(() => {
    //   // Ignore errors if logout button not found
    // });
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Common test helpers
 */
export class TestHelpers {
  /**
   * Wait for network to be idle (no pending requests)
   */
  static async waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Take a screenshot with a custom name
   */
  static async takeScreenshot(
    page: Page,
    name: string,
    fullPage = true
  ): Promise<void> {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage,
    });
  }

  /**
   * Fill form field by label text
   */
  static async fillByLabel(
    page: Page,
    label: string,
    value: string
  ): Promise<void> {
    const input = page.locator(`label:has-text("${label}") + input`);
    await input.fill(value);
  }

  /**
   * Click button by text content
   */
  static async clickButtonByText(page: Page, text: string): Promise<void> {
    await page.click(`button:has-text("${text}")`);
  }

  /**
   * Wait for element and check if it's visible
   */
  static async isVisible(
    page: Page,
    selector: string,
    timeout = 5000
  ): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate random email for testing
   */
  static generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  /**
   * Generate random string
   */
  static generateRandomString(length = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  /**
   * Simulate slow network conditions
   */
  static async simulateSlowNetwork(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8,
      latency: 200,
    });
  }

  /**
   * Clear all cookies and local storage
   */
  static async clearAllData(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Mock API response
   */
  static async mockApiResponse(
    page: Page,
    urlPattern: string,
    response: any,
    status = 200
  ): Promise<void> {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Wait for and count network requests
   */
  static async countNetworkRequests(
    page: Page,
    urlPattern: string | RegExp
  ): Promise<number> {
    let count = 0;
    page.on('request', (request) => {
      const url = request.url();
      if (
        typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url)
      ) {
        count++;
      }
    });
    return count;
  }
}
