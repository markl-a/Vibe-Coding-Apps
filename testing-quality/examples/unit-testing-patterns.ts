/**
 * Unit Testing Patterns with Vitest/Jest
 *
 * This file demonstrates various unit testing patterns and best practices
 * for writing effective, maintainable unit tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 1. BASIC UNIT TESTS - Testing Pure Functions
// ============================================================================

/**
 * Calculator class for demonstrating unit test patterns
 */
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  percentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }
}

describe('Calculator - Basic Unit Tests', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(calculator.add(5, 0)).toBe(5);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
    });

    it('should handle decimal results', () => {
      expect(calculator.divide(10, 3)).toBeCloseTo(3.333, 2);
    });
  });
});

// ============================================================================
// 2. TESTING WITH DIFFERENT DATA SETS - Parameterized Tests
// ============================================================================

describe('Calculator - Parameterized Tests', () => {
  const calculator = new Calculator();

  describe.each([
    { a: 1, b: 1, expected: 2 },
    { a: 2, b: 3, expected: 5 },
    { a: -1, b: 1, expected: 0 },
    { a: 0, b: 0, expected: 0 },
    { a: 100, b: 200, expected: 300 },
  ])('add($a, $b)', ({ a, b, expected }) => {
    it(`should return ${expected}`, () => {
      expect(calculator.add(a, b)).toBe(expected);
    });
  });

  describe.each([
    { value: 100, percentage: 10, expected: 10 },
    { value: 200, percentage: 50, expected: 100 },
    { value: 50, percentage: 20, expected: 10 },
    { value: 1000, percentage: 5, expected: 50 },
  ])('percentage($value, $percentage)', ({ value, percentage, expected }) => {
    it(`should return ${expected}`, () => {
      expect(calculator.percentage(value, percentage)).toBe(expected);
    });
  });
});

// ============================================================================
// 3. TESTING CLASSES WITH STATE
// ============================================================================

/**
 * Shopping cart with internal state
 */
class ShoppingCart {
  private items: Map<string, { price: number; quantity: number }> = new Map();

  addItem(id: string, price: number, quantity: number = 1): void {
    const existing = this.items.get(id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(id, { price, quantity });
    }
  }

  removeItem(id: string): void {
    this.items.delete(id);
  }

  updateQuantity(id: string, quantity: number): void {
    const item = this.items.get(id);
    if (item) {
      item.quantity = quantity;
    }
  }

  getTotal(): number {
    let total = 0;
    for (const item of this.items.values()) {
      total += item.price * item.quantity;
    }
    return total;
  }

  getItemCount(): number {
    let count = 0;
    for (const item of this.items.values()) {
      count += item.quantity;
    }
    return count;
  }

  clear(): void {
    this.items.clear();
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }
}

describe('ShoppingCart - Stateful Tests', () => {
  let cart: ShoppingCart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  describe('initial state', () => {
    it('should start empty', () => {
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getTotal()).toBe(0);
      expect(cart.getItemCount()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add a new item', () => {
      cart.addItem('item1', 10.99);
      expect(cart.isEmpty()).toBe(false);
      expect(cart.getItemCount()).toBe(1);
      expect(cart.getTotal()).toBe(10.99);
    });

    it('should increment quantity for existing items', () => {
      cart.addItem('item1', 10.99, 2);
      cart.addItem('item1', 10.99, 1);
      expect(cart.getItemCount()).toBe(3);
      expect(cart.getTotal()).toBeCloseTo(32.97, 2);
    });

    it('should handle multiple different items', () => {
      cart.addItem('item1', 10.99);
      cart.addItem('item2', 5.99);
      cart.addItem('item3', 15.99);
      expect(cart.getItemCount()).toBe(3);
      expect(cart.getTotal()).toBeCloseTo(32.97, 2);
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      cart.addItem('item1', 10.99);
      cart.removeItem('item1');
      expect(cart.isEmpty()).toBe(true);
    });

    it('should only remove the specified item', () => {
      cart.addItem('item1', 10.99);
      cart.addItem('item2', 5.99);
      cart.removeItem('item1');
      expect(cart.getItemCount()).toBe(1);
      expect(cart.getTotal()).toBe(5.99);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      cart.addItem('item1', 10.99, 1);
      cart.updateQuantity('item1', 5);
      expect(cart.getItemCount()).toBe(5);
      expect(cart.getTotal()).toBeCloseTo(54.95, 2);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      cart.addItem('item1', 10.99);
      cart.addItem('item2', 5.99);
      cart.clear();
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getTotal()).toBe(0);
    });
  });
});

// ============================================================================
// 4. TESTING ASYNC FUNCTIONS
// ============================================================================

/**
 * User service with async operations
 */
class UserService {
  async fetchUser(id: string): Promise<{ id: string; name: string; email: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    if (id === 'invalid') {
      throw new Error('User not found');
    }

    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
    };
  }

  async createUser(name: string, email: string): Promise<{ id: string; name: string; email: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
    };
  }

  async updateUser(id: string, updates: Partial<{ name: string; email: string }>): Promise<{ id: string; name: string; email: string }> {
    const user = await this.fetchUser(id);
    return { ...user, ...updates };
  }
}

describe('UserService - Async Tests', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('fetchUser', () => {
    it('should fetch a user by id', async () => {
      const user = await service.fetchUser('123');
      expect(user).toEqual({
        id: '123',
        name: 'User 123',
        email: 'user123@example.com',
      });
    });

    it('should reject with error for invalid id', async () => {
      await expect(service.fetchUser('invalid')).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const user = await service.createUser('John Doe', 'john@example.com');
      expect(user).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(user.id).toBeDefined();
    });

    it('should reject invalid email', async () => {
      await expect(service.createUser('John', 'invalid-email')).rejects.toThrow('Invalid email');
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const updated = await service.updateUser('123', { name: 'Jane Doe' });
      expect(updated.name).toBe('Jane Doe');
      expect(updated.id).toBe('123');
    });
  });
});

// ============================================================================
// 5. TESTING WITH TIMERS
// ============================================================================

class RateLimiter {
  private attempts: number = 0;
  private resetTime: number = 0;
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  attempt(): boolean {
    const now = Date.now();

    if (now > this.resetTime) {
      this.attempts = 0;
      this.resetTime = now + this.windowMs;
    }

    if (this.attempts >= this.maxAttempts) {
      return false;
    }

    this.attempts++;
    return true;
  }

  reset(): void {
    this.attempts = 0;
    this.resetTime = 0;
  }

  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attempts);
  }
}

describe('RateLimiter - Timer Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow attempts up to the limit', () => {
    const limiter = new RateLimiter(3, 60000);

    expect(limiter.attempt()).toBe(true);
    expect(limiter.attempt()).toBe(true);
    expect(limiter.attempt()).toBe(true);
    expect(limiter.attempt()).toBe(false);
  });

  it('should reset after time window', () => {
    const limiter = new RateLimiter(3, 60000);

    // Use all attempts
    limiter.attempt();
    limiter.attempt();
    limiter.attempt();
    expect(limiter.attempt()).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61000);

    // Should be able to attempt again
    expect(limiter.attempt()).toBe(true);
  });

  it('should track remaining attempts', () => {
    const limiter = new RateLimiter(5, 60000);

    expect(limiter.getRemainingAttempts()).toBe(5);
    limiter.attempt();
    expect(limiter.getRemainingAttempts()).toBe(4);
    limiter.attempt();
    expect(limiter.getRemainingAttempts()).toBe(3);
  });
});

// ============================================================================
// 6. SNAPSHOT TESTING
// ============================================================================

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    privacy: 'public' | 'private';
  };
  createdAt: Date;
}

class UserProfileBuilder {
  build(userId: string): UserProfile {
    return {
      id: userId,
      username: `user_${userId}`,
      email: `user${userId}@example.com`,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Software developer passionate about testing',
        avatar: `https://avatar.example.com/${userId}`,
      },
      settings: {
        theme: 'light',
        notifications: true,
        privacy: 'public',
      },
      createdAt: new Date('2024-01-01'),
    };
  }
}

describe('UserProfileBuilder - Snapshot Tests', () => {
  it('should match profile structure snapshot', () => {
    const builder = new UserProfileBuilder();
    const profile = builder.build('123');
    expect(profile).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const builder = new UserProfileBuilder();
    const profile = builder.build('456');
    expect(profile).toMatchInlineSnapshot();
  });
});

// ============================================================================
// 7. TESTING ERROR BOUNDARIES AND EDGE CASES
// ============================================================================

class ArrayProcessor {
  static findMax(numbers: number[]): number {
    if (!numbers || numbers.length === 0) {
      throw new Error('Array cannot be empty');
    }
    return Math.max(...numbers);
  }

  static findMin(numbers: number[]): number {
    if (!numbers || numbers.length === 0) {
      throw new Error('Array cannot be empty');
    }
    return Math.min(...numbers);
  }

  static average(numbers: number[]): number {
    if (!numbers || numbers.length === 0) {
      throw new Error('Array cannot be empty');
    }
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  }

  static median(numbers: number[]): number {
    if (!numbers || numbers.length === 0) {
      throw new Error('Array cannot be empty');
    }
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

describe('ArrayProcessor - Edge Cases', () => {
  describe('error handling', () => {
    it('should throw on empty array', () => {
      expect(() => ArrayProcessor.findMax([])).toThrow('Array cannot be empty');
      expect(() => ArrayProcessor.findMin([])).toThrow('Array cannot be empty');
      expect(() => ArrayProcessor.average([])).toThrow('Array cannot be empty');
      expect(() => ArrayProcessor.median([])).toThrow('Array cannot be empty');
    });

    it('should throw on null/undefined', () => {
      expect(() => ArrayProcessor.findMax(null as any)).toThrow();
      expect(() => ArrayProcessor.findMax(undefined as any)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle single element', () => {
      expect(ArrayProcessor.findMax([5])).toBe(5);
      expect(ArrayProcessor.findMin([5])).toBe(5);
      expect(ArrayProcessor.average([5])).toBe(5);
      expect(ArrayProcessor.median([5])).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(ArrayProcessor.findMax([-1, -5, -3])).toBe(-1);
      expect(ArrayProcessor.findMin([-1, -5, -3])).toBe(-5);
    });

    it('should handle floating point numbers', () => {
      const result = ArrayProcessor.average([1.5, 2.5, 3.5]);
      expect(result).toBeCloseTo(2.5, 2);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      expect(ArrayProcessor.findMax(largeArray)).toBe(9999);
      expect(ArrayProcessor.findMin(largeArray)).toBe(0);
    });
  });

  describe('median calculation', () => {
    it('should calculate median for odd-length arrays', () => {
      expect(ArrayProcessor.median([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should calculate median for even-length arrays', () => {
      expect(ArrayProcessor.median([1, 2, 3, 4])).toBe(2.5);
    });

    it('should handle unsorted arrays', () => {
      expect(ArrayProcessor.median([5, 1, 3, 2, 4])).toBe(3);
    });
  });
});

// ============================================================================
// 8. CUSTOM MATCHERS
// ============================================================================

// Extend Vitest/Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

interface CustomMatchers<R = unknown> {
  toBeWithinRange(floor: number, ceiling: number): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

describe('Custom Matchers', () => {
  it('should use custom matcher', () => {
    expect(15).toBeWithinRange(10, 20);
    expect(5).not.toBeWithinRange(10, 20);
  });
});

export {};
