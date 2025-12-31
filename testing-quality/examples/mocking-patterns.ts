/**
 * Mocking and Stubbing Patterns with Vitest/Jest
 *
 * This file demonstrates various mocking patterns including:
 * - Function mocks
 * - Module mocks
 * - Class mocks
 * - Spy functions
 * - Partial mocks
 * - Mock implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 1. BASIC FUNCTION MOCKING
// ============================================================================

describe('Basic Function Mocking', () => {
  it('should mock a simple function', () => {
    const mockFn = vi.fn();

    mockFn('hello');
    mockFn('world');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('hello');
    expect(mockFn).toHaveBeenCalledWith('world');
  });

  it('should mock function with return value', () => {
    const mockFn = vi.fn().mockReturnValue(42);

    const result = mockFn();

    expect(result).toBe(42);
    expect(mockFn).toHaveBeenCalled();
  });

  it('should mock function with multiple return values', () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default');

    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).toBe('default');
    expect(mockFn()).toBe('default');
  });

  it('should mock async function', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await mockFn();

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalled();
  });

  it('should mock rejected promises', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('failed'));

    await expect(mockFn()).rejects.toThrow('failed');
    expect(mockFn).toHaveBeenCalled();
  });

  it('should use custom implementation', () => {
    const mockFn = vi.fn((a: number, b: number) => a + b);

    const result = mockFn(2, 3);

    expect(result).toBe(5);
    expect(mockFn).toHaveBeenCalledWith(2, 3);
  });
});

// ============================================================================
// 2. SPYING ON METHODS
// ============================================================================

class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  compute(a: number, b: number): number {
    return this.add(a, b) * this.multiply(a, b);
  }
}

describe('Spying on Methods', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  it('should spy on method calls', () => {
    const addSpy = vi.spyOn(calculator, 'add');

    calculator.add(2, 3);

    expect(addSpy).toHaveBeenCalledWith(2, 3);
    expect(addSpy).toHaveReturnedWith(5);
  });

  it('should spy and override implementation', () => {
    const addSpy = vi.spyOn(calculator, 'add').mockReturnValue(100);

    const result = calculator.add(2, 3);

    expect(result).toBe(100);
    expect(addSpy).toHaveBeenCalled();
  });

  it('should restore original implementation', () => {
    const addSpy = vi.spyOn(calculator, 'add').mockReturnValue(100);
    expect(calculator.add(2, 3)).toBe(100);

    addSpy.mockRestore();
    expect(calculator.add(2, 3)).toBe(5);
  });

  it('should spy on multiple methods', () => {
    const addSpy = vi.spyOn(calculator, 'add');
    const multiplySpy = vi.spyOn(calculator, 'multiply');

    calculator.compute(2, 3);

    expect(addSpy).toHaveBeenCalledWith(2, 3);
    expect(multiplySpy).toHaveBeenCalledWith(2, 3);
  });

  it('should track call order', () => {
    const addSpy = vi.spyOn(calculator, 'add');
    const multiplySpy = vi.spyOn(calculator, 'multiply');

    calculator.add(1, 2);
    calculator.multiply(3, 4);
    calculator.add(5, 6);

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(multiplySpy).toHaveBeenCalledTimes(1);

    // Check call order using mock.calls
    expect(addSpy.mock.calls[0]).toEqual([1, 2]);
    expect(multiplySpy.mock.calls[0]).toEqual([3, 4]);
    expect(addSpy.mock.calls[1]).toEqual([5, 6]);
  });
});

// ============================================================================
// 3. MOCKING CLASSES
// ============================================================================

class UserService {
  async fetchUser(id: string): Promise<{ id: string; name: string }> {
    // Actual implementation would call API
    throw new Error('Not implemented');
  }

  async updateUser(id: string, data: any): Promise<void> {
    throw new Error('Not implemented');
  }
}

class UserController {
  constructor(private userService: UserService) {}

  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.userService.fetchUser(id);
  }

  async updateUserName(id: string, name: string): Promise<void> {
    await this.userService.updateUser(id, { name });
  }
}

describe('Mocking Classes', () => {
  let mockUserService: UserService;
  let controller: UserController;

  beforeEach(() => {
    // Create a mock instance
    mockUserService = {
      fetchUser: vi.fn(),
      updateUser: vi.fn(),
    } as any;

    controller = new UserController(mockUserService);
  });

  it('should mock class methods', async () => {
    const mockUser = { id: '123', name: 'John Doe' };
    vi.mocked(mockUserService.fetchUser).mockResolvedValue(mockUser);

    const user = await controller.getUser('123');

    expect(user).toEqual(mockUser);
    expect(mockUserService.fetchUser).toHaveBeenCalledWith('123');
  });

  it('should mock multiple class methods', async () => {
    vi.mocked(mockUserService.fetchUser).mockResolvedValue({
      id: '123',
      name: 'John Doe',
    });
    vi.mocked(mockUserService.updateUser).mockResolvedValue(undefined);

    await controller.updateUserName('123', 'Jane Doe');

    expect(mockUserService.updateUser).toHaveBeenCalledWith('123', {
      name: 'Jane Doe',
    });
  });

  it('should verify interaction between classes', async () => {
    const mockUser = { id: '123', name: 'John' };
    vi.mocked(mockUserService.fetchUser).mockResolvedValue(mockUser);

    await controller.getUser('123');

    expect(mockUserService.fetchUser).toHaveBeenCalledTimes(1);
    expect(mockUserService.updateUser).not.toHaveBeenCalled();
  });
});

// ============================================================================
// 4. PARTIAL MOCKING
// ============================================================================

class EmailService {
  sendEmail(to: string, subject: string, body: string): boolean {
    // Actual email sending logic
    console.log(`Sending email to ${to}`);
    return true;
  }

  validateEmail(email: string): boolean {
    return email.includes('@');
  }

  formatEmailBody(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || '');
  }
}

describe('Partial Mocking', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  it('should mock only specific methods', () => {
    // Mock only sendEmail, keep other methods real
    const sendSpy = vi.spyOn(emailService, 'sendEmail').mockReturnValue(true);

    // Use real validateEmail
    expect(emailService.validateEmail('test@example.com')).toBe(true);
    expect(emailService.validateEmail('invalid')).toBe(false);

    // Use mocked sendEmail
    emailService.sendEmail('test@example.com', 'Test', 'Body');
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should combine real and mocked methods', () => {
    const sendSpy = vi.spyOn(emailService, 'sendEmail').mockReturnValue(true);

    // Use real formatting
    const body = emailService.formatEmailBody('Hello {name}!', { name: 'John' });
    expect(body).toBe('Hello John!');

    // Use mocked sending
    emailService.sendEmail('test@example.com', 'Greeting', body);
    expect(sendSpy).toHaveBeenCalledWith('test@example.com', 'Greeting', 'Hello John!');
  });
});

// ============================================================================
// 5. MOCKING EXTERNAL DEPENDENCIES
// ============================================================================

// Mock external HTTP client
interface HttpClient {
  get(url: string): Promise<any>;
  post(url: string, data: any): Promise<any>;
}

class ApiClient {
  constructor(private http: HttpClient) {}

  async getUsers(): Promise<any[]> {
    const response = await this.http.get('/api/users');
    return response.data;
  }

  async createUser(user: any): Promise<any> {
    const response = await this.http.post('/api/users', user);
    return response.data;
  }
}

describe('Mocking External Dependencies', () => {
  let mockHttp: HttpClient;
  let apiClient: ApiClient;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
    };
    apiClient = new ApiClient(mockHttp);
  });

  it('should mock HTTP GET requests', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ];

    vi.mocked(mockHttp.get).mockResolvedValue({ data: mockUsers });

    const users = await apiClient.getUsers();

    expect(users).toEqual(mockUsers);
    expect(mockHttp.get).toHaveBeenCalledWith('/api/users');
  });

  it('should mock HTTP POST requests', async () => {
    const newUser = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: 3, ...newUser };

    vi.mocked(mockHttp.post).mockResolvedValue({ data: createdUser });

    const result = await apiClient.createUser(newUser);

    expect(result).toEqual(createdUser);
    expect(mockHttp.post).toHaveBeenCalledWith('/api/users', newUser);
  });

  it('should handle HTTP errors', async () => {
    vi.mocked(mockHttp.get).mockRejectedValue(new Error('Network error'));

    await expect(apiClient.getUsers()).rejects.toThrow('Network error');
  });
});

// ============================================================================
// 6. MOCK IMPLEMENTATIONS
// ============================================================================

interface Database {
  query(sql: string): Promise<any[]>;
  execute(sql: string): Promise<void>;
}

class UserRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<any[]> {
    return this.db.query('SELECT * FROM users');
  }

  async findById(id: string): Promise<any | null> {
    const results = await this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
    return results[0] || null;
  }

  async create(user: any): Promise<void> {
    await this.db.execute(`INSERT INTO users VALUES (...)`);
  }
}

describe('Mock Implementations', () => {
  let mockDb: Database;
  let repository: UserRepository;

  beforeEach(() => {
    // Create mock with implementation
    mockDb = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM users')) {
          return Promise.resolve([
            { id: '1', name: 'User 1' },
            { id: '2', name: 'User 2' },
          ]);
        }
        return Promise.resolve([]);
      }),
      execute: vi.fn().mockResolvedValue(undefined),
    };

    repository = new UserRepository(mockDb);
  });

  it('should use mock implementation', async () => {
    const users = await repository.findAll();

    expect(users).toHaveLength(2);
    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM users');
  });

  it('should handle different queries with same mock', async () => {
    vi.mocked(mockDb.query).mockImplementation((sql: string) => {
      if (sql.includes("id = '123'")) {
        return Promise.resolve([{ id: '123', name: 'Specific User' }]);
      }
      return Promise.resolve([]);
    });

    const user = await repository.findById('123');

    expect(user).toEqual({ id: '123', name: 'Specific User' });
  });

  it('should track multiple calls with implementation', async () => {
    await repository.findAll();
    await repository.findById('123');

    expect(mockDb.query).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// 7. TIMER MOCKS
// ============================================================================

class Scheduler {
  schedule(callback: () => void, delay: number): NodeJS.Timeout {
    return setTimeout(callback, delay);
  }

  scheduleRecurring(callback: () => void, interval: number): NodeJS.Timeout {
    return setInterval(callback, interval);
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}

describe('Timer Mocks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should mock setTimeout', () => {
    const callback = vi.fn();
    const scheduler = new Scheduler();

    scheduler.schedule(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should mock setInterval', () => {
    const callback = vi.fn();
    const scheduler = new Scheduler();

    scheduler.scheduleRecurring(callback, 1000);

    vi.advanceTimersByTime(3500);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should test debounced function', () => {
    const func = vi.fn();
    const scheduler = new Scheduler();
    const debounced = scheduler.debounce(func, 1000);

    // Call multiple times
    debounced('a');
    debounced('b');
    debounced('c');

    // Function should not be called yet
    expect(func).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    // Function should be called once with last argument
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('c');
  });

  it('should handle multiple debounce cycles', () => {
    const func = vi.fn();
    const scheduler = new Scheduler();
    const debounced = scheduler.debounce(func, 500);

    debounced('first');
    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledWith('first');

    debounced('second');
    vi.advanceTimersByTime(500);
    expect(func).toHaveBeenCalledWith('second');

    expect(func).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// 8. MOCK MODULES
// ============================================================================

// Simulate external module
const externalLogger = {
  info: (message: string) => console.log('[INFO]', message),
  error: (message: string) => console.error('[ERROR]', message),
  warn: (message: string) => console.warn('[WARN]', message),
};

class ApplicationService {
  processData(data: any): void {
    externalLogger.info('Processing data');

    try {
      // Process data
      if (!data) {
        throw new Error('Invalid data');
      }
      externalLogger.info('Data processed successfully');
    } catch (error) {
      externalLogger.error(`Processing failed: ${error}`);
      throw error;
    }
  }
}

describe('Module Mocks', () => {
  let service: ApplicationService;
  let loggerSpy: any;

  beforeEach(() => {
    service = new ApplicationService();

    // Spy on logger methods
    loggerSpy = {
      info: vi.spyOn(externalLogger, 'info').mockImplementation(() => {}),
      error: vi.spyOn(externalLogger, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(externalLogger, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mock logger calls', () => {
    service.processData({ valid: true });

    expect(loggerSpy.info).toHaveBeenCalledWith('Processing data');
    expect(loggerSpy.info).toHaveBeenCalledWith('Data processed successfully');
    expect(loggerSpy.error).not.toHaveBeenCalled();
  });

  it('should log errors when processing fails', () => {
    expect(() => service.processData(null)).toThrow('Invalid data');

    expect(loggerSpy.info).toHaveBeenCalledWith('Processing data');
    expect(loggerSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('Processing failed')
    );
  });
});

// ============================================================================
// 9. MOCK RESET AND RESTORE
// ============================================================================

describe('Mock Reset and Restore', () => {
  it('should reset mock calls', () => {
    const mockFn = vi.fn();

    mockFn('first');
    mockFn('second');
    expect(mockFn).toHaveBeenCalledTimes(2);

    mockFn.mockReset();

    expect(mockFn).toHaveBeenCalledTimes(0);
    mockFn('third');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should clear mock calls and results', () => {
    const mockFn = vi.fn().mockReturnValue('value');

    mockFn();
    expect(mockFn).toHaveBeenCalled();

    mockFn.mockClear();

    expect(mockFn).not.toHaveBeenCalled();
    expect(mockFn()).toBe('value'); // Implementation still exists
  });

  it('should restore original implementation', () => {
    const calculator = new Calculator();
    const spy = vi.spyOn(calculator, 'add').mockReturnValue(999);

    expect(calculator.add(2, 3)).toBe(999);

    spy.mockRestore();

    expect(calculator.add(2, 3)).toBe(5);
  });
});

// ============================================================================
// 10. ADVANCED MOCK PATTERNS
// ============================================================================

describe('Advanced Mock Patterns', () => {
  it('should mock with conditional logic', () => {
    const mockFn = vi.fn().mockImplementation((input: number) => {
      if (input < 0) return 'negative';
      if (input === 0) return 'zero';
      return 'positive';
    });

    expect(mockFn(-5)).toBe('negative');
    expect(mockFn(0)).toBe('zero');
    expect(mockFn(5)).toBe('positive');
  });

  it('should mock with stateful behavior', () => {
    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      return `Call ${callCount}`;
    });

    expect(mockFn()).toBe('Call 1');
    expect(mockFn()).toBe('Call 2');
    expect(mockFn()).toBe('Call 3');
  });

  it('should chain multiple mock configurations', () => {
    const mockFn = vi
      .fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockRejectedValueOnce(new Error('error'))
      .mockResolvedValue('default');

    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).rejects.toThrow('error');
    expect(mockFn()).resolves.toBe('default');
  });

  it('should verify mock call arguments with matchers', () => {
    const mockFn = vi.fn();

    mockFn({ id: 1, name: 'John', email: 'john@example.com' });

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'John',
      })
    );

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: expect.stringContaining('@'),
      })
    );
  });

  it('should use asymmetric matchers', () => {
    const mockFn = vi.fn();

    mockFn('test', 123, true);

    expect(mockFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      expect.any(Boolean)
    );
  });
});

export {};
