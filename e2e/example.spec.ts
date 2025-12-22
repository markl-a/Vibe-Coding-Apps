import { test, expect, TestHelpers } from './fixtures';

/**
 * E2E Test Suite - Example Web Application
 *
 * This test suite demonstrates various E2E testing patterns including:
 * - Navigation and page interactions
 * - Form submissions
 * - Authentication flows
 * - API mocking
 * - Responsive design testing
 * - Accessibility testing
 */

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Vibe Coding Apps/i);

    // Check for main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Verify navigation links
    const homeLink = page.locator('nav a[href="/"]');
    const productsLink = page.locator('nav a[href*="products"]');

    await expect(homeLink).toBeVisible();
    await expect(productsLink).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('[aria-label*="menu" i]').first();
    await expect(mobileMenuButton).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test('should search for products', async ({ page }) => {
    await page.goto('/');

    // Find and fill search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    ).first();
    await searchInput.fill('laptop');

    // Submit search
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForURL('**/search**');

    // Verify results are displayed
    const results = page.locator('[data-testid="search-results"]');
    await expect(results).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty search gracefully', async ({ page }) => {
    await page.goto('/search');

    // Verify empty state message
    const emptyMessage = page.locator('text=/no results|empty/i').first();
    await expect(emptyMessage).toBeVisible();
  });
});

test.describe('User Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.locator('button:has-text("Login"), button:has-text("Sign in")')
    ).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Login")'
    ).first();
    await submitButton.click();

    // Check for validation messages
    const errorMessage = page.locator('text=/required|invalid|error/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Login")'
    ).first();
    await submitButton.click();

    // Check for error message
    const errorMessage = page.locator(
      'text=/invalid credentials|login failed|incorrect/i'
    ).first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test.skip('should login successfully with valid credentials', async ({
    page,
    testUser,
  }) => {
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Submit form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Login")'
    ).first();
    await submitButton.click();

    // Wait for successful login redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify user is logged in
    const userProfile = page.locator('[data-testid="user-profile"]');
    await expect(userProfile).toBeVisible();
  });
});

test.describe('Product Catalog', () => {
  test('should display products list', async ({ page }) => {
    await page.goto('/products');

    // Wait for products to load
    await page.waitForLoadState('networkidle');

    // Check for product items
    const products = page.locator('[data-testid*="product"]');
    const count = await products.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/products');

    // Find and click category filter
    const categoryFilter = page.locator(
      '[data-testid="category-filter"], select[name="category"]'
    ).first();

    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 });

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify URL or results updated
      const url = page.url();
      expect(url).toContain('category');
    }
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/products');

    // Wait for products to load
    await page.waitForLoadState('networkidle');

    // Click first product
    const firstProduct = page.locator('[data-testid*="product"]').first();
    await firstProduct.click();

    // Wait for product detail page
    await page.waitForURL('**/product/**');

    // Verify product details are displayed
    const productTitle = page.locator('h1').first();
    await expect(productTitle).toBeVisible();

    const productPrice = page.locator(
      'text=/\\$[0-9]+|price/i'
    ).first();
    await expect(productPrice).toBeVisible();
  });
});

test.describe('Shopping Cart', () => {
  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');

    // Find and click add to cart button
    const addToCartButton = page.locator(
      'button:has-text("Add to Cart")'
    ).first();

    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();

      // Wait for confirmation
      const notification = page.locator(
        'text=/added to cart|success/i'
      ).first();
      await expect(notification).toBeVisible({ timeout: 5000 });

      // Check cart badge/counter updated
      const cartBadge = page.locator('[data-testid="cart-count"]');
      if (await cartBadge.isVisible()) {
        const count = await cartBadge.textContent();
        expect(parseInt(count || '0')).toBeGreaterThan(0);
      }
    }
  });

  test('should view cart', async ({ page }) => {
    await page.goto('/cart');

    // Verify cart page loads
    await expect(page).toHaveURL(/cart/);

    // Check for cart items or empty state
    const cartItems = page.locator('[data-testid*="cart-item"]');
    const emptyCart = page.locator('text=/empty cart|no items/i');

    const hasItems = (await cartItems.count()) > 0;
    const isEmpty = await emptyCart.isVisible();

    expect(hasItems || isEmpty).toBeTruthy();
  });

  test('should update cart quantity', async ({ page }) => {
    // This test would require a cart with items
    // Skipping if cart is empty
    await page.goto('/cart');

    const quantityInput = page.locator(
      'input[type="number"], input[name*="quantity"]'
    ).first();

    if (await quantityInput.isVisible()) {
      await quantityInput.fill('2');
      await quantityInput.press('Enter');

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify total updated
      const total = page.locator('[data-testid="cart-total"]');
      await expect(total).toBeVisible();
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');

    const removeButton = page.locator(
      'button:has-text("Remove"), button[aria-label*="remove" i]'
    ).first();

    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Wait for confirmation
      await page.waitForTimeout(1000);

      // Verify item removed
      const notification = page.locator(
        'text=/removed|deleted/i'
      ).first();
      await expect(notification).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Checkout Flow', () => {
  test.skip('should proceed to checkout', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/cart');

    // Click checkout button
    const checkoutButton = authenticatedPage.locator(
      'button:has-text("Checkout"), a:has-text("Checkout")'
    );
    await checkoutButton.click();

    // Verify checkout page loads
    await authenticatedPage.waitForURL('**/checkout');

    // Check for checkout form
    await expect(
      authenticatedPage.locator('form, [data-testid="checkout-form"]')
    ).toBeVisible();
  });

  test.skip('should fill shipping information', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/checkout');

    // Fill shipping form
    await TestHelpers.fillByLabel(
      authenticatedPage,
      'Full Name',
      'John Doe'
    );
    await TestHelpers.fillByLabel(
      authenticatedPage,
      'Address',
      '123 Main St'
    );
    await TestHelpers.fillByLabel(
      authenticatedPage,
      'City',
      'New York'
    );
    await TestHelpers.fillByLabel(
      authenticatedPage,
      'Postal Code',
      '10001'
    );

    // Continue to payment
    await TestHelpers.clickButtonByText(authenticatedPage, 'Continue');

    // Verify moved to payment step
    await expect(
      authenticatedPage.locator('text=/payment|card details/i')
    ).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check h1 exists
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThan(0);

    // Check for proper alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await TestHelpers.simulateSlowNetwork(page);

    await page.goto('/');

    // Should still load successfully (with longer timeout)
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/products');

    // Should show error message
    const errorMessage = page.locator(
      'text=/error|failed to load|something went wrong/i'
    ).first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;

    // Mock API to fail first request, succeed on retry
    await page.route('**/api/products', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          body: 'Error',
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 1, name: 'Test Product' }]),
        });
      }
    });

    await page.goto('/products');

    // Wait for retry to succeed
    await page.waitForTimeout(3000);

    expect(requestCount).toBeGreaterThan(1);
  });
});
