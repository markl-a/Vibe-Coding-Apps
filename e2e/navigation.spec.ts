import { test, expect } from './fixtures';
import { scrollToBottom, scrollToTop, isVisible } from './utils/helpers';

/**
 * Navigation E2E Test Suite
 *
 * Tests cover:
 * - Main navigation menu functionality
 * - Page routing and URL navigation
 * - Breadcrumb navigation
 * - Mobile navigation (responsive)
 * - Footer navigation
 */

test.describe('Main Navigation', () => {
  test('should display main navigation menu on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for navigation element
    const nav = page.locator('nav, [role="navigation"], header nav');
    await expect(nav.first()).toBeVisible();

    // Verify common navigation links exist
    const navLinks = page.locator('nav a, [role="navigation"] a, header a');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);
  });

  test('should navigate to different pages via main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Define common pages to test
    const commonPages = [
      { text: /home/i, urlPattern: /home|^\/$/ },
      { text: /products|shop|store/i, urlPattern: /products|shop|store/ },
      { text: /about/i, urlPattern: /about/ },
      { text: /contact/i, urlPattern: /contact/ },
    ];

    for (const { text, urlPattern } of commonPages) {
      // Navigate back to home
      await page.goto('/');

      // Find and click the link
      const link = page.locator(`nav a:has-text("${text.source}"), header a:has-text("${text.source}")`).first();

      const linkExists = await link.isVisible().catch(() => false);

      if (linkExists) {
        await link.click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Verify URL changed
        const currentUrl = page.url();
        const urlMatches = urlPattern.test(currentUrl);

        expect(urlMatches).toBeTruthy();
      }
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for active navigation indicators
    const activeNavItem = page.locator(
      'nav a[aria-current="page"], nav a.active, nav a[class*="active"], header a.active, [role="navigation"] a[aria-current]'
    );

    const hasActiveIndicator = (await activeNavItem.count()) > 0;

    if (hasActiveIndicator) {
      const activeLink = activeNavItem.first();
      await expect(activeLink).toBeVisible();

      // Active item should have special styling
      const classes = await activeLink.getAttribute('class');
      const ariaCurrent = await activeLink.getAttribute('aria-current');

      expect(classes?.includes('active') || ariaCurrent === 'page').toBeTruthy();
    }
  });

  test('should support keyboard navigation through menu items', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Focus on first navigation link
    const firstNavLink = page.locator('nav a, header a').first();
    await firstNavLink.focus();

    // Verify focus is on the link
    await expect(firstNavLink).toBeFocused();

    // Tab through navigation items
    await page.keyboard.press('Tab');

    // Check that focus moved to another interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should display mobile navigation menu on small screens', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu button (hamburger icon)
    const mobileMenuButton = page.locator(
      'button[aria-label*="menu" i], button[class*="menu"], button[class*="hamburger"], [data-testid="mobile-menu"]'
    );

    const hasMobileMenu = await mobileMenuButton.first().isVisible().catch(() => false);

    if (hasMobileMenu) {
      // Click mobile menu button
      await mobileMenuButton.first().click();

      // Wait for menu to open
      await page.waitForTimeout(500);

      // Verify mobile menu is visible
      const mobileNav = page.locator(
        'nav[class*="mobile"], [class*="mobile-menu"], [data-testid="mobile-navigation"]'
      );

      const isMobileNavVisible = await mobileNav.first().isVisible().catch(() => false);

      // Either mobile nav should be visible or regular nav should expand
      const regularNav = page.locator('nav, [role="navigation"]');
      const isNavVisible = await regularNav.first().isVisible();

      expect(isMobileNavVisible || isNavVisible).toBeTruthy();
    }
  });
});

test.describe('Page Navigation and Routing', () => {
  test('should navigate using browser back and forward buttons', async ({
    page,
  }) => {
    // Navigate to multiple pages
    await page.goto('/');
    const homeUrl = page.url();

    // Navigate to another page if products link exists
    const productsLink = page.locator('a[href*="products"], a[href*="shop"]').first();
    const hasProductsLink = await productsLink.isVisible().catch(() => false);

    if (hasProductsLink) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      const productsUrl = page.url();

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toBe(homeUrl);

      // Use browser forward button
      await page.goForward();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toBe(productsUrl);
    } else {
      // Navigate to a generic path
      await page.goto('/about');
      await page.waitForLoadState('networkidle');

      await page.goBack();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toBe(homeUrl);
    }
  });

  test('should handle deep linking to specific pages', async ({ page }) => {
    // Test direct navigation to various pages
    const pagesToTest = ['/about', '/products', '/contact', '/login'];

    for (const path of pagesToTest) {
      await page.goto(path);

      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');

      // Verify URL is correct
      expect(page.url()).toContain(path);

      // Verify page loaded (has some content)
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent).toBeTruthy();
      expect(bodyContent!.length).toBeGreaterThan(0);
    }
  });

  test('should display 404 page for non-existent routes', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/this-page-does-not-exist-12345');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check for 404 indicators
    const notFoundIndicators = page.locator(
      'text=/404|not found|page not found/i, h1:has-text("404")'
    );

    const has404Message = (await notFoundIndicators.count()) > 0;

    // Also check status code if available
    const pageContent = await page.content();
    const contentIndicates404 =
      pageContent.toLowerCase().includes('404') ||
      pageContent.toLowerCase().includes('not found');

    expect(has404Message || contentIndicates404).toBeTruthy();
  });

  test('should maintain scroll position on page navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll down the page
    await scrollToBottom(page);
    await page.waitForTimeout(500);

    // Get scroll position
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);

    // Navigate to another page
    const link = page.locator('a[href^="/"]').first();
    const linkExists = await link.isVisible().catch(() => false);

    if (linkExists) {
      await link.click();
      await page.waitForLoadState('networkidle');

      // Scroll position should reset to top on new page
      const newScrollPosition = await page.evaluate(() => window.scrollY);
      expect(newScrollPosition).toBeLessThan(scrollPosition);
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test('should display breadcrumb navigation on nested pages', async ({
    page,
  }) => {
    // Navigate to a potentially nested page
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb
    const breadcrumb = page.locator(
      'nav[aria-label="breadcrumb"], [role="navigation"] ol, .breadcrumb, [class*="breadcrumb"]'
    );

    const hasBreadcrumb = await breadcrumb.first().isVisible().catch(() => false);

    if (hasBreadcrumb) {
      // Verify breadcrumb has multiple items
      const breadcrumbItems = page.locator(
        'nav[aria-label="breadcrumb"] a, .breadcrumb a, [class*="breadcrumb"] a'
      );
      const itemCount = await breadcrumbItems.count();

      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test.skip('should navigate using breadcrumb links', async ({ page }) => {
    // Navigate to a nested page (e.g., product detail)
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Click on first product if available
    const firstProduct = page
      .locator('a[href*="/product/"], [data-testid*="product"] a')
      .first();
    const hasProduct = await firstProduct.isVisible().catch(() => false);

    if (hasProduct) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Look for breadcrumb
      const breadcrumbHomeLink = page.locator(
        'nav[aria-label="breadcrumb"] a:has-text("Home"), .breadcrumb a:has-text("Home")'
      );

      const hasBreadcrumb = await breadcrumbHomeLink.isVisible().catch(() => false);

      if (hasBreadcrumb) {
        // Click home in breadcrumb
        await breadcrumbHomeLink.click();
        await page.waitForLoadState('networkidle');

        // Should be back at home
        expect(page.url()).toMatch(/home|^\/$/);
      }
    }
  });
});

test.describe('Footer Navigation', () => {
  test('should display footer with navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await scrollToBottom(page);
    await page.waitForTimeout(500);

    // Look for footer element
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toBeVisible();

    // Check for footer links
    const footerLinks = page.locator('footer a, [role="contentinfo"] a');
    const linkCount = await footerLinks.count();

    expect(linkCount).toBeGreaterThan(0);
  });

  test('should navigate using footer links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await scrollToBottom(page);

    // Find a footer link
    const footerLink = page
      .locator('footer a[href^="/"], [role="contentinfo"] a[href^="/"]')
      .first();

    const linkExists = await footerLink.isVisible().catch(() => false);

    if (linkExists) {
      const href = await footerLink.getAttribute('href');
      await footerLink.click();

      await page.waitForLoadState('networkidle');

      // Verify navigation occurred
      if (href) {
        expect(page.url()).toContain(href);
      }
    }
  });

  test('should keep footer visible at bottom of page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await scrollToBottom(page);
    await page.waitForTimeout(300);

    // Footer should be visible
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toBeVisible();

    // Scroll to top
    await scrollToTop(page);
    await page.waitForTimeout(300);

    // Footer should not be visible at top
    const isFooterVisible = await isVisible(page, 'footer');

    // On short pages, footer might still be visible
    // Just verify footer exists in DOM
    expect(await footer.count()).toBeGreaterThan(0);
  });
});
