import type { Page } from '@playwright/test';

/**
 * E2E Test Helper Utilities
 *
 * Common utility functions for E2E testing
 */

/**
 * Generate a unique email address for testing
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length = 10): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random number within a range
 */
export function generateRandomNumber(min = 1, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await wait(waitTime);
    }
  }

  throw new Error('Retry failed');
}

/**
 * Wait for element to be stable (not animating)
 */
export async function waitForStableElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  const element = page.locator(selector);
  let previousBox = await element.boundingBox();

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    await wait(100);
    const currentBox = await element.boundingBox();

    if (
      previousBox &&
      currentBox &&
      previousBox.x === currentBox.x &&
      previousBox.y === currentBox.y &&
      previousBox.width === currentBox.width &&
      previousBox.height === currentBox.height
    ) {
      return;
    }

    previousBox = currentBox;
  }
}

/**
 * Scroll to bottom of page
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/**
 * Scroll to top of page
 */
export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}

/**
 * Get all cookies as a map
 */
export async function getCookies(page: Page): Promise<Map<string, string>> {
  const cookies = await page.context().cookies();
  return new Map(cookies.map((c) => [c.name, c.value]));
}

/**
 * Set cookie
 */
export async function setCookie(
  page: Page,
  name: string,
  value: string,
  options?: {
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }
): Promise<void> {
  await page.context().addCookies([
    {
      name,
      value,
      url: page.url(),
      ...options,
    },
  ]);
}

/**
 * Clear all browser data
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(
  page: Page,
  key: string
): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Mock geolocation
 */
export async function mockGeolocation(
  page: Page,
  latitude: number,
  longitude: number
): Promise<void> {
  await page.context().setGeolocation({ latitude, longitude });
  await page.context().grantPermissions(['geolocation']);
}

/**
 * Mock network speed (slow 3G)
 */
export async function mockSlowNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  });
}

/**
 * Mock network speed (fast 4G)
 */
export async function mockFastNetwork(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
  });
}

/**
 * Mock offline mode
 */
export async function mockOfflineMode(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/**
 * Restore online mode
 */
export async function restoreOnlineMode(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

/**
 * Take full page screenshot
 */
export async function takeFullPageScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Take element screenshot
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<void> {
  const element = page.locator(selector);
  await element.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
  });
}

/**
 * Get element text content
 */
export async function getTextContent(
  page: Page,
  selector: string
): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Get all text contents matching selector
 */
export async function getAllTextContents(
  page: Page,
  selector: string
): Promise<string[]> {
  const elements = page.locator(selector);
  return await elements.allTextContents();
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Check if element is visible
 */
export async function isVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, {
      state: 'visible',
      timeout: 2000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
}

/**
 * Format date
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Get current timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create test data
 */
export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  const random = generateRandomString(6);
  return {
    firstName: `Test${random}`,
    lastName: 'User',
    email: generateTestEmail('testuser'),
    password: 'Test123!@#',
    phone: '555-0100',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      country: 'US',
    },
    ...overrides,
  };
}

/**
 * Create test product
 */
export interface TestProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
}

export function createTestProduct(
  overrides?: Partial<TestProduct>
): TestProduct {
  const random = generateRandomString(6);
  return {
    name: `Test Product ${random}`,
    description: 'This is a test product for E2E testing',
    price: generateRandomNumber(10, 1000),
    category: 'Electronics',
    sku: `SKU-${random.toUpperCase()}`,
    stock: generateRandomNumber(0, 100),
    ...overrides,
  };
}
