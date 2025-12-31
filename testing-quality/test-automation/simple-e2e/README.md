# Simple E2E Test Automation

A comprehensive E2E test automation framework using Playwright with the Page Object Pattern.

## Features

- **Page Object Pattern**: Maintainable, reusable page objects
- **Custom Fixtures**: Test data and page object injection
- **Multi-Browser Testing**: Chrome, Firefox, Safari, Mobile
- **API Testing**: Direct API testing alongside E2E
- **Test Utilities**: Helpers for common testing tasks
- **Mock Support**: API response mocking

## Quick Start

```bash
# Install dependencies
pnpm install

# Install browsers
npx playwright install

# Run tests
pnpm test

# Run with UI
pnpm test:ui

# Run in headed mode
pnpm test:headed

# Generate test code
pnpm codegen
```

## Project Structure

```
simple-e2e/
├── playwright.config.ts    # Playwright configuration
├── src/
│   ├── fixtures/           # Custom test fixtures
│   │   └── index.ts
│   ├── pages/              # Page objects
│   │   ├── BasePage.ts
│   │   ├── HomePage.ts
│   │   ├── LoginPage.ts
│   │   └── SearchPage.ts
│   └── utils/              # Test utilities
│       ├── test-helpers.ts
│       └── api-client.ts
└── tests/                  # Test files
    ├── home.spec.ts
    ├── login.spec.ts
    ├── search.spec.ts
    └── api.spec.ts
```

## Writing Tests

### Using Page Objects

```typescript
import { test, expect } from '../src/fixtures/index.js';

test('should login successfully', async ({ loginPage, testUser, page }) => {
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### Using API Mocking

```typescript
import { mockApiResponse } from '../src/utils/test-helpers.js';

test('should show error', async ({ loginPage, page }) => {
  await mockApiResponse(page, '**/api/auth/login', {
    status: 401,
    body: { error: 'Invalid credentials' },
  });

  await loginPage.login('test@test.com', 'wrong');
  expect(await loginPage.hasError()).toBe(true);
});
```

### Creating Page Objects

```typescript
import { BasePage } from './BasePage.js';

export class MyPage extends BasePage {
  readonly url = '/my-page';

  // Define locators
  readonly submitButton = this.page.locator('[data-testid="submit"]');

  // Define actions
  async submit(): Promise<void> {
    await this.safeClick(this.submitButton);
    await this.waitForPageLoad();
  }
}
```

## Configuration

### Environment Variables

```bash
# Set base URL
BASE_URL=https://staging.example.com pnpm test

# Set API URL for API tests
API_URL=https://api.example.com pnpm test
```

### Browser Selection

```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project="Mobile Chrome"
```

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Keep tests independent** - each test should work alone
3. **Use fixtures** for test data and setup
4. **Mock external dependencies** for reliable tests
5. **Use descriptive test names** that explain the scenario

## Test Utilities

### Available Helpers

| Helper | Description |
|--------|-------------|
| `mockApiResponse` | Mock API responses |
| `waitForNetworkIdle` | Wait for network to settle |
| `generateRandomEmail` | Generate unique test emails |
| `retryWithBackoff` | Retry failed actions |
| `takeTimestampedScreenshot` | Capture screenshots |

### API Client

```typescript
import { ApiClient } from '../src/utils/api-client.js';

const client = new ApiClient(request, 'https://api.example.com');
const response = await client.get('/users');
expect(response.status).toBe(200);
```

## Reports

```bash
# View HTML report
pnpm report
```

Reports include:
- Test results summary
- Screenshots on failure
- Video recordings
- Trace viewer for debugging

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [API Testing](https://playwright.dev/docs/api-testing)

## License

MIT
