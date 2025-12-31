import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { SearchPage } from '../pages/SearchPage.js';

/**
 * Custom Test Fixtures
 *
 * Fixtures provide reusable test setup and teardown.
 * They are automatically cleaned up after each test.
 */

// Define fixture types
export type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  searchPage: SearchPage;
  testUser: { email: string; password: string };
};

// Extend base test with our fixtures
export const test = base.extend<Fixtures>({
  // Page object fixtures
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await use(searchPage);
  },

  // Test data fixtures
  testUser: async ({}, use) => {
    // In real tests, you might fetch this from environment or create dynamically
    const user = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };
    await use(user);
  },
});

export { expect };
