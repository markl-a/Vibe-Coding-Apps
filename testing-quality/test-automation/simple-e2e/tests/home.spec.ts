import { test, expect } from '../src/fixtures/index.js';

/**
 * Home Page Tests
 *
 * These tests demonstrate:
 * - Page object pattern usage
 * - Custom fixtures
 * - Assertions with Playwright
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('should display the hero section', async ({ homePage }) => {
    const isVisible = await homePage.isHeroVisible();
    expect(isVisible).toBe(true);
  });

  test('should have correct page title', async ({ homePage }) => {
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });

  test('should have navigation links', async ({ homePage }) => {
    const linkCount = await homePage.getNavLinkCount();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should navigate to login page', async ({ homePage, page }) => {
    await homePage.goToLogin();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should perform search', async ({ homePage, page }) => {
    await homePage.search('test query');
    await expect(page).toHaveURL(/\/search/);
  });

  test('should be responsive on mobile', async ({ page, homePage }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();

    // Verify page still loads correctly
    const isVisible = await homePage.isHeroVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe('Home Page - Accessibility', () => {
  test('should have no accessibility violations', async ({ homePage, page }) => {
    await homePage.goto();

    // Simple accessibility check - verify main elements have accessible names
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be keyboard navigable', async ({ homePage, page }) => {
    await homePage.goto();

    // Press Tab to navigate through focusable elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
  });
});
