# E2E Testing Framework

This directory contains the End-to-End (E2E) testing framework using Playwright.

## Directory Structure

```
e2e/
├── fixtures/           # Test fixtures and custom test extensions
│   └── index.ts       # Custom fixtures (authenticated pages, test users, etc.)
├── pages/             # Page Object Models (POM)
│   ├── BasePage.ts    # Base page with common functionality
│   ├── LoginPage.ts   # Login page object
│   └── ProductPage.ts # Product page object
├── utils/             # Utility functions and helpers
├── example.spec.ts    # Example E2E test suite
└── README.md          # This file
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Playwright Browsers

```bash
pnpm playwright:install
```

Or for specific browsers:
```bash
pnpm exec playwright install chromium
pnpm exec playwright install firefox
pnpm exec playwright install webkit
```

### 3. Run Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests on specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit
```

### 4. View Test Reports

```bash
pnpm test:e2e:report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Expected Title/);
  });
});
```

### Using Page Objects

```typescript
import { test, expect } from './fixtures';
import { LoginPage } from './pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');
  await loginPage.waitForSuccessfulLogin();
});
```

### Using Custom Fixtures

```typescript
import { test, expect } from './fixtures';

test('should access authenticated page', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/dashboard');
  // ... test authenticated functionality
});
```

## Best Practices

### 1. Use Page Object Model (POM)

Encapsulate page interactions in Page Objects to:
- Improve test maintainability
- Reduce code duplication
- Make tests more readable

### 2. Use Data Test IDs

Add `data-testid` attributes to elements for stable selectors:

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

### 3. Wait for Elements Properly

```typescript
// Good - explicit wait
await page.waitForSelector('[data-testid="content"]');

// Good - auto-wait with assertions
await expect(page.locator('[data-testid="content"]')).toBeVisible();

// Avoid - arbitrary timeouts
await page.waitForTimeout(5000); // Only use when absolutely necessary
```

### 4. Use Fixtures for Common Setup

Create fixtures for reusable setup/teardown:

```typescript
export const test = base.extend({
  adminPage: async ({ page }, use) => {
    // Setup: login as admin
    await page.goto('/admin/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await use(page);

    // Teardown: logout
    await page.click('[data-testid="logout"]');
  },
});
```

### 5. Handle Flaky Tests

```typescript
// Retry failed tests in CI
test('potentially flaky test', async ({ page }) => {
  // ... test code
});

// Or disable retries for specific test
test('should not retry', async ({ page }) => {
  test.info().annotations.push({ type: 'no-retry' });
  // ... test code
});
```

### 6. Mock API Responses

```typescript
test('should handle API errors', async ({ page }) => {
  // Mock API response
  await page.route('**/api/products', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server Error' }),
    });
  });

  await page.goto('/products');
  // ... test error handling
});
```

## Test Configuration

Configuration is in `playwright.config.ts` at the project root.

### Key Configuration Options

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 1 on CI, CPU cores locally
- **Screenshots**: Captured on failure (full page)
- **Videos**: Recorded on failure only
- **Trace**: Captured on first retry

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test123!@#
```

## CI Integration

E2E tests run automatically on CI for all browsers (Chrome, Firefox, Safari).

### GitHub Actions Workflow

Tests run on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

Test artifacts (reports, screenshots, videos) are uploaded and retained for 30 days.

## Debugging Tests

### 1. Debug Mode

```bash
pnpm test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### 2. UI Mode

```bash
pnpm test:e2e:ui
```

Interactive UI for running and debugging tests.

### 3. Headed Mode

```bash
pnpm test:e2e:headed
```

See the browser while tests run.

### 4. View Trace

If a test fails, view the trace:

```bash
pnpm exec playwright show-trace test-results/path-to-trace.zip
```

## Common Patterns

### Testing Forms

```typescript
test('should submit form', async ({ page }) => {
  await page.goto('/contact');

  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="message"]', 'Hello!');

  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Testing Navigation

```typescript
test('should navigate between pages', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/about"]');

  await expect(page).toHaveURL(/about/);
  await expect(page.locator('h1')).toHaveText('About Us');
});
```

### Testing Responsive Design

```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Test mobile-specific behavior
  await page.click('[data-testid="mobile-menu"]');
  await expect(page.locator('[data-testid="nav-menu"]')).toBeVisible();
});
```

### Testing Authentication

```typescript
test('should require authentication', async ({ page }) => {
  await page.goto('/dashboard');

  // Should redirect to login
  await expect(page).toHaveURL(/login/);
});

test('should access protected page when logged in', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');

  // Should stay on dashboard
  await expect(authenticatedPage).toHaveURL(/dashboard/);
});
```

## Troubleshooting

### Tests Failing Locally but Passing in CI

- Check browser versions: `pnpm exec playwright --version`
- Update browsers: `pnpm playwright:install`
- Clear test cache: `rm -rf test-results/`

### Timeout Errors

- Increase timeout in `playwright.config.ts`
- Use more specific waits
- Check if app is running on correct port

### Element Not Found

- Verify selector is correct
- Check if element is in iframe
- Wait for element to appear
- Use more stable selectors (data-testid)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Fixtures Guide](https://playwright.dev/docs/test-fixtures)
