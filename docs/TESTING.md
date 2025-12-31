# Testing Guide

Comprehensive testing documentation for the Vibe Coding Apps monorepo.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Component Testing](#component-testing)
6. [Performance Testing](#performance-testing)
7. [Running Tests](#running-tests)
8. [Best Practices](#best-practices)
9. [Anti-Patterns](#anti-patterns)

---

## Testing Philosophy

### The Testing Pyramid

Our testing strategy follows the testing pyramid approach:

```
           /\
          /  \
         / E2E \
        /--------\
       /          \
      / Integration \
     /--------------\
    /                \
   /   Unit Tests     \
  /____________________\
```

- **Unit Tests (70%)**: Fast, isolated tests for individual functions and components
- **Integration Tests (20%)**: Test interactions between modules, services, and databases
- **E2E Tests (10%)**: Full user journey tests through the entire application

### Core Principles

1. **Fast Feedback**: Tests should run quickly to enable rapid development
2. **Reliability**: Tests should be deterministic and not flaky
3. **Maintainability**: Tests should be easy to understand and update
4. **Coverage**: Aim for 80%+ code coverage, focus on critical paths
5. **Isolation**: Tests should not depend on external state or other tests

---

## Unit Testing

### Tools & Setup

We use **Vitest** as our primary testing framework for TypeScript/JavaScript projects.

#### Configuration Example

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

#### Setup File

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';

// Global test setup
beforeAll(() => {
  // Setup code
});

afterEach(() => {
  // Cleanup after each test
});
```

### Writing Unit Tests

#### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FeatureName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

#### Testing Utilities

```typescript
// Example: Testing validation utilities
import { describe, it, expect } from 'vitest';
import { isEmail, isStrongPassword, isURL } from '../validation';

describe('Validation Utils', () => {
  describe('isEmail', () => {
    it('should validate correct email', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isEmail('invalid')).toBe(false);
      expect(isEmail('invalid@')).toBe(false);
      expect(isEmail('@invalid.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isEmail('')).toBe(false);
      expect(isEmail('a@b.c')).toBe(true);
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false); // no uppercase, number, special
      expect(isStrongPassword('Password')).toBe(false); // no number, special
      expect(isStrongPassword('Pass1!')).toBe(false); // too short
    });
  });
});
```

### Mocking Patterns

#### Mocking External Dependencies

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock entire module
vi.mock('aws-sdk', () => {
  return {
    S3: vi.fn().mockImplementation(() => ({
      upload: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/bucket/file.jpg',
          ETag: '"abc123"',
          Key: 'file.jpg'
        })
      })
    }))
  };
});

describe('Storage Service', () => {
  it('should upload file to S3', async () => {
    const file = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      size: 1024
    };

    const result = await storageService.uploadToS3(file, 'test-file.jpg');

    expect(result.fileKey).toBe('test-file.jpg');
    expect(result.url).toBeDefined();
  });
});
```

#### Mocking Functions

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Service with Dependencies', () => {
  it('should call external API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'success' })
    });

    global.fetch = mockFetch;

    const result = await apiService.getData();

    expect(mockFetch).toHaveBeenCalledWith('/api/data');
    expect(result.data).toBe('success');
  });
});
```

#### Spying on Methods

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Service Integration', () => {
  it('should route to correct provider', async () => {
    storageService.provider = 'S3';
    const spy = vi.spyOn(storageService, 'uploadToS3');

    await storageService.uploadFile(mockFile);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

### Coverage Requirements

#### Target Coverage: 80%+

```bash
# Run tests with coverage
pnpm test -- --coverage

# View coverage report
open coverage/index.html
```

#### Coverage Configuration

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/__tests__/**',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/index.ts',
    'src/types/**',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

---

## Integration Testing

Integration tests verify that different parts of your application work together correctly.

### Database Testing

#### Using MongoDB Memory Server

```javascript
const mongoose = require('mongoose');

describe('Payment API Integration', () => {
  beforeAll(async () => {
    const MONGODB_TEST_URI =
      process.env.MONGODB_TEST_URI ||
      'mongodb://localhost:27017/test_db';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it('should create and retrieve payment', async () => {
    const payment = await Payment.create({
      orderId: 'ORD-123',
      amount: 100,
      status: 'pending'
    });

    const found = await Payment.findById(payment._id);
    expect(found.orderId).toBe('ORD-123');
  });
});
```

#### Using Test Containers (Recommended)

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Database Integration Tests', () => {
  let container: StartedTestContainer;
  let connectionString: string;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:14')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb'
      })
      .start();

    const port = container.getMappedPort(5432);
    connectionString = `postgresql://test:test@localhost:${port}/testdb`;

    // Initialize database connection
    await db.connect(connectionString);
  });

  afterAll(async () => {
    await db.disconnect();
    await container.stop();
  });

  it('should perform database operations', async () => {
    const user = await db.users.create({
      name: 'Test User',
      email: 'test@example.com'
    });

    expect(user.id).toBeDefined();
  });
});
```

### API Testing

#### Using Supertest

```javascript
const request = require('supertest');
const app = require('../app');

describe('Fraud Detection API', () => {
  describe('POST /api/payments/fraud/check', () => {
    it('should detect low risk for small transaction', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 50,
          method: 'credit_card',
          userId: 'USER-123',
          billingAddress: { country: 'USA' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body.riskLevel).toBe('low');
      expect(response.body.shouldBlock).toBe(false);
    });

    it('should detect high risk for large transaction', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 7000,
          method: 'credit_card',
          userId: 'USER-123',
          billingAddress: { country: 'USA' }
        })
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThan(80);
      expect(response.body.shouldBlock).toBe(true);
    });
  });
});
```

#### NestJS Integration Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';

describe('Auth Integration Tests', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should handle complete login flow', async () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const result = await controller.login(loginDto);

    expect(result.access_token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.password).toBeUndefined();
  });
});
```

---

## E2E Testing

We use **Playwright** for end-to-end testing across multiple browsers.

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,

  expect: {
    timeout: 5000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },

    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Test Organization

```
e2e/
├── fixtures/          # Shared fixtures and test data
│   └── index.ts
├── pages/            # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── ProductPage.ts
├── utils/            # Helper utilities
│   └── helpers.ts
├── auth.spec.ts      # Authentication tests
├── navigation.spec.ts # Navigation tests
└── forms.spec.ts     # Form tests
```

### Fixtures & Helpers

#### Custom Fixtures

```typescript
// e2e/fixtures/index.ts
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type TestUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type TestFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
};

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    };
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Perform login
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await use(page);

    // Cleanup after test
  },
});

export { expect };
```

#### Helper Utilities

```typescript
// e2e/utils/helpers.ts
import type { Page } from '@playwright/test';

export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function mockApiResponse(
  page: Page,
  urlPattern: string,
  response: unknown,
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
```

### Page Object Model

```typescript
// e2e/pages/BasePage.ts
import type { Page, Locator } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElement(selector: string, timeout = 5000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async clickElement(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }
}
```

```typescript
// e2e/pages/LoginPage.ts
import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.goto('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill('input[type="password"]', password);
  }

  async clickLogin(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }
}
```

### Writing E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from './fixtures';
import { LoginPage } from './pages/LoginPage';
import { generateTestEmail, clearBrowserData } from './utils/helpers';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
  });

  test('should display login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await expect(page).toHaveTitle(/login|sign in/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.login(
      generateTestEmail('invalid'),
      'wrongpassword'
    );

    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({
    page,
    testUser,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.login(testUser.email, testUser.password);

    await expect(page).toHaveURL(/dashboard|home/);
  });
});
```

---

## Component Testing

We use **React Testing Library** for component testing, following best practices for accessibility and user-centric testing.

### React Testing Library Patterns

#### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-200');
  });
});
```

#### Testing Interactive Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  it('should call onSearch when typing', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchInput onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test query');
    });
  });

  it('should debounce search input', async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<SearchInput onSearch={onSearch} debounce={500} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(onSearch).toHaveBeenCalledWith('test');
    vi.useRealTimers();
  });
});
```

#### Testing Forms

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Accessibility Testing

#### Using jest-axe

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click me</Button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', async () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>
    );

    const button = getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Testing ARIA Labels

```typescript
describe('Accessible Components', () => {
  it('should have proper ARIA labels', () => {
    render(
      <form>
        <label htmlFor="email">Email Address</label>
        <input id="email" type="email" aria-required="true" />
      </form>
    );

    const input = screen.getByLabelText(/email address/i);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should announce loading state', () => {
    render(<Button isLoading>Submit</Button>);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });
});
```

---

## Performance Testing

### Measuring Component Performance

```typescript
import { render } from '@testing-library/react';
import { measureRender } from './test-utils';

describe('Performance Tests', () => {
  it('should render large list efficiently', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const { duration } = measureRender(
      () => render(<VirtualList items={items} />)
    );

    expect(duration).toBeLessThan(100); // Should render in <100ms
  });
});
```

### Playwright Performance Testing

```typescript
import { test, expect } from '@playwright/test';

test('should load page within performance budget', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3s budget
});

test('should have good Core Web Vitals', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries);
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    });
  });

  // Assert on metrics
  expect(metrics).toBeDefined();
});
```

### Load Testing

```typescript
// Using k6 for load testing
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/users');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## Running Tests

### Commands for Different Test Types

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- src/utils/validation.test.ts

# Run tests matching pattern
pnpm test -- --grep "authentication"

# Run unit tests only (in specific package)
cd packages/ui-components
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in debug mode
pnpm test:e2e:debug

# Run E2E tests in specific browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Show E2E test report
pnpm test:e2e:report
```

### Turbo Commands (Monorepo)

```bash
# Run all tests across all packages
turbo run test

# Run tests in specific package
turbo run test --filter=@vibe/ui-components

# Run tests with cache
turbo run test --cache-dir=.turbo

# Run tests in parallel
turbo run test --parallel
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test -- --coverage

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Best Practices

### 1. Test Naming

```typescript
// Good: Describes what and expected behavior
it('should return validation error when email is invalid', () => {});

// Bad: Vague description
it('test email', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange: Setup test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 20, quantity: 1 },
  ];

  // Act: Execute the function
  const total = calculateTotal(items);

  // Assert: Verify the result
  expect(total).toBe(40);
});
```

### 3. Don't Test Implementation Details

```typescript
// Bad: Testing implementation
it('should call internal method', () => {
  const spy = vi.spyOn(service, '_privateMethod');
  service.publicMethod();
  expect(spy).toHaveBeenCalled();
});

// Good: Testing behavior
it('should return formatted data', () => {
  const result = service.publicMethod();
  expect(result).toEqual({ formatted: true });
});
```

### 4. Use Test Data Builders

```typescript
// test-utils/builders.ts
export class UserBuilder {
  private user = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  withAdmin() {
    this.user.role = 'admin';
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  build() {
    return this.user;
  }
}

// Usage in tests
const adminUser = new UserBuilder().withAdmin().build();
```

### 5. Keep Tests Independent

```typescript
// Bad: Tests depend on each other
let userId;

it('should create user', () => {
  userId = createUser();
});

it('should update user', () => {
  updateUser(userId); // Depends on previous test
});

// Good: Independent tests
it('should create user', () => {
  const userId = createUser();
  expect(userId).toBeDefined();
});

it('should update user', () => {
  const userId = createUser();
  const result = updateUser(userId);
  expect(result.success).toBe(true);
});
```

### 6. Use Descriptive Assertions

```typescript
// Bad: Generic assertion
expect(result).toBeTruthy();

// Good: Specific assertion
expect(result.status).toBe('success');
expect(result.data).toHaveLength(5);
expect(result.errors).toBeUndefined();
```

### 7. Mock Only What You Need

```typescript
// Bad: Over-mocking
vi.mock('./services/user');
vi.mock('./services/auth');
vi.mock('./services/payment');
vi.mock('./services/email');

// Good: Mock only dependencies
vi.mock('./services/payment', () => ({
  processPayment: vi.fn().mockResolvedValue({ success: true }),
}));
```

### 8. Test Edge Cases

```typescript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimals', () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 2);
  });
});
```

### 9. Use Custom Matchers

```typescript
// Custom matcher
expect.extend({
  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () =>
        `expected ${received} to ${pass ? 'not ' : ''}be a valid email`,
    };
  },
});

// Usage
expect('test@example.com').toBeValidEmail();
```

### 10. Parallelize Tests

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
  },
});
```

---

## Anti-Patterns

### 1. Don't Use Random Data in Tests

```typescript
// Bad: Random data makes tests flaky
it('should validate user', () => {
  const user = {
    age: Math.random() * 100, // Flaky!
  };
  expect(isAdult(user)).toBe(true);
});

// Good: Use deterministic data
it('should validate adult user', () => {
  const user = { age: 25 };
  expect(isAdult(user)).toBe(true);
});

it('should validate minor user', () => {
  const user = { age: 15 };
  expect(isAdult(user)).toBe(false);
});
```

### 2. Don't Test Multiple Things in One Test

```typescript
// Bad: Testing multiple behaviors
it('should handle user operations', () => {
  const user = createUser();
  expect(user).toBeDefined();

  updateUser(user.id);
  expect(user.name).toBe('updated');

  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});

// Good: Split into separate tests
it('should create user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

it('should update user', () => {
  const user = createUser();
  updateUser(user.id);
  expect(getUser(user.id).name).toBe('updated');
});
```

### 3. Don't Use setTimeout in Tests

```typescript
// Bad: Using setTimeout
it('should load data', (done) => {
  loadData();
  setTimeout(() => {
    expect(data).toBeDefined();
    done();
  }, 1000);
});

// Good: Use waitFor
it('should load data', async () => {
  loadData();
  await waitFor(() => {
    expect(data).toBeDefined();
  });
});
```

### 4. Don't Ignore Flaky Tests

```typescript
// Bad: Skipping flaky tests
it.skip('should work sometimes', () => {
  // Flaky test
});

// Good: Fix the root cause
it('should work consistently', async () => {
  // Wait for async operation to complete
  await waitForDataToLoad();
  expect(data).toBeDefined();
});
```

### 5. Don't Make Tests Too DRY

```typescript
// Bad: Over-abstracted
beforeEach(() => {
  setupComplexTestScenario();
});

it('should test A', () => {
  // Hard to understand what's being tested
});

// Good: Some duplication is OK for clarity
it('should test A', () => {
  const user = { name: 'Test', role: 'admin' };
  const result = performAction(user);
  expect(result.success).toBe(true);
});
```

### 6. Don't Test Third-Party Libraries

```typescript
// Bad: Testing lodash
it('should merge objects', () => {
  expect(_.merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
});

// Good: Test your code that uses the library
it('should merge user preferences', () => {
  const defaults = { theme: 'light' };
  const userPrefs = { language: 'en' };
  const result = getUserSettings(defaults, userPrefs);
  expect(result).toEqual({ theme: 'light', language: 'en' });
});
```

### 7. Don't Test Private Methods Directly

```typescript
// Bad: Accessing private methods
it('should format date', () => {
  const formatted = service['_formatDate'](date);
  expect(formatted).toBe('2024-01-01');
});

// Good: Test through public API
it('should return formatted user data', () => {
  const userData = service.getUserData(userId);
  expect(userData.joinDate).toBe('2024-01-01');
});
```

### 8. Don't Use Real External Services

```typescript
// Bad: Calling real API
it('should fetch user data', async () => {
  const data = await fetch('https://api.example.com/users/1');
  expect(data).toBeDefined();
});

// Good: Mock external calls
it('should fetch user data', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: 'Test' }),
  });

  const data = await fetchUserData(1);
  expect(data.name).toBe('Test');
});
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

## Questions?

For questions or issues related to testing:
1. Check existing test files for examples
2. Refer to this documentation
3. Ask in team chat or create an issue
4. Consult the official documentation for each tool

Happy Testing! 🧪
