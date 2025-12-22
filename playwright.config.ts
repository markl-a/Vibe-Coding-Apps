import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Features:
 * - Multi-browser support (Chrome, Firefox, Safari)
 * - Screenshot and video recording on failures
 * - HTML, JSON, and JUnit report generation
 * - CI/CD integration with retries
 * - Mobile viewport testing
 * - Automatic dev server startup
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory containing all E2E tests
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Maximum time expect() should wait for the condition to be met
  expect: {
    timeout: 5000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only - helps handle flaky tests in CI environment */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI for more stable results */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    // HTML report for visual inspection
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    // JSON report for programmatic access
    ['json', { outputFile: 'test-results/results.json' }],
    // JUnit XML for CI integration
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // Console output for real-time feedback
    ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    /* Screenshot settings - capture on failure for debugging */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    /* Video recording - only keep videos of failed tests to save space */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },

    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    /* Action timeout */
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop browsers - Core testing
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific options
        launchOptions: {
          args: ['--disable-dev-shm-usage'],
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    /* Test against mobile viewports for responsive design */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    /* Test against branded browsers - uncomment if needed */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
