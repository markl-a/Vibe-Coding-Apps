/**
 * Test Data Generation Patterns
 *
 * This file demonstrates various patterns for generating test data including:
 * - Factory functions
 * - Builders
 * - Fixtures
 * - Random data generation
 * - Data seeding
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// 1. FACTORY FUNCTIONS
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
}

class UserFactory {
  private static counter = 0;

  static create(overrides?: Partial<User>): User {
    this.counter++;

    return {
      id: `user-${this.counter}`,
      email: `user${this.counter}@example.com`,
      name: `Test User ${this.counter}`,
      age: 25,
      role: 'user',
      createdAt: new Date(),
      settings: {
        notifications: true,
        theme: 'light',
        language: 'en',
      },
      ...overrides,
    };
  }

  static createAdmin(overrides?: Partial<User>): User {
    return this.create({ role: 'admin', ...overrides });
  }

  static createModerator(overrides?: Partial<User>): User {
    return this.create({ role: 'moderator', ...overrides });
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static reset(): void {
    this.counter = 0;
  }
}

describe('Factory Functions', () => {
  beforeEach(() => {
    UserFactory.reset();
  });

  it('should create user with default values', () => {
    const user = UserFactory.create();

    expect(user).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      name: expect.any(String),
      age: 25,
      role: 'user',
    });
  });

  it('should create user with custom values', () => {
    const user = UserFactory.create({
      name: 'Custom Name',
      age: 30,
    });

    expect(user.name).toBe('Custom Name');
    expect(user.age).toBe(30);
    expect(user.role).toBe('user'); // default value preserved
  });

  it('should create admin user', () => {
    const admin = UserFactory.createAdmin({ name: 'Admin User' });

    expect(admin.role).toBe('admin');
    expect(admin.name).toBe('Admin User');
  });

  it('should create multiple users', () => {
    const users = UserFactory.createMany(5);

    expect(users).toHaveLength(5);
    expect(users[0].id).toBe('user-1');
    expect(users[4].id).toBe('user-5');
  });
});

// ============================================================================
// 2. BUILDER PATTERN
// ============================================================================

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
}

class ProductBuilder {
  private product: Product = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    category: 'electronics',
    tags: [],
    inStock: true,
    rating: 4.5,
    reviews: 0,
  };

  withId(id: string): this {
    this.product.id = id;
    return this;
  }

  withName(name: string): this {
    this.product.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.product.price = price;
    return this;
  }

  withCategory(category: string): this {
    this.product.category = category;
    return this;
  }

  withTags(...tags: string[]): this {
    this.product.tags = tags;
    return this;
  }

  outOfStock(): this {
    this.product.inStock = false;
    return this;
  }

  withRating(rating: number, reviews: number = 0): this {
    this.product.rating = rating;
    this.product.reviews = reviews;
    return this;
  }

  expensive(): this {
    this.product.price = 999.99;
    return this;
  }

  cheap(): this {
    this.product.price = 9.99;
    return this;
  }

  build(): Product {
    return { ...this.product };
  }
}

describe('Builder Pattern', () => {
  it('should build product with default values', () => {
    const product = new ProductBuilder().build();

    expect(product).toMatchObject({
      id: 'prod-1',
      name: 'Test Product',
      price: 99.99,
      inStock: true,
    });
  });

  it('should build product with custom values using fluent API', () => {
    const product = new ProductBuilder()
      .withId('prod-123')
      .withName('Laptop')
      .withPrice(1299.99)
      .withCategory('computers')
      .withTags('electronics', 'portable', 'work')
      .withRating(4.8, 250)
      .build();

    expect(product).toMatchObject({
      id: 'prod-123',
      name: 'Laptop',
      price: 1299.99,
      category: 'computers',
      tags: ['electronics', 'portable', 'work'],
      rating: 4.8,
      reviews: 250,
    });
  });

  it('should build out-of-stock product', () => {
    const product = new ProductBuilder()
      .withName('Rare Item')
      .outOfStock()
      .build();

    expect(product.inStock).toBe(false);
  });

  it('should use convenience methods', () => {
    const cheapProduct = new ProductBuilder().cheap().build();
    expect(cheapProduct.price).toBe(9.99);

    const expensiveProduct = new ProductBuilder().expensive().build();
    expect(expensiveProduct.price).toBe(999.99);
  });

  it('should create multiple variations', () => {
    const builder = new ProductBuilder();

    const product1 = builder.withName('Product 1').build();
    const product2 = builder.withName('Product 2').expensive().build();

    expect(product1.name).toBe('Product 1');
    expect(product2.name).toBe('Product 2');
    expect(product2.price).toBe(999.99);
  });
});

// ============================================================================
// 3. RANDOM DATA GENERATION
// ============================================================================

class DataGenerator {
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }

  static randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(6)}.com`;
  }

  static randomBoolean(): boolean {
    return Math.random() > 0.5;
  }

  static randomDate(start: Date, end: Date): Date {
    const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(timestamp);
  }

  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static randomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  static randomPhone(): string {
    return `+1-${this.randomInt(200, 999)}-${this.randomInt(200, 999)}-${this.randomInt(1000, 9999)}`;
  }

  static randomName(): string {
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return `${this.randomElement(firstNames)} ${this.randomElement(lastNames)}`;
  }

  static randomAddress(): {
    street: string;
    city: string;
    state: string;
    zip: string;
  } {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ'];

    return {
      street: `${this.randomInt(1, 9999)} ${this.randomElement(['Main', 'Oak', 'Pine', 'Maple'])} St`,
      city: this.randomElement(cities),
      state: this.randomElement(states),
      zip: this.randomInt(10000, 99999).toString(),
    };
  }
}

describe('Random Data Generation', () => {
  it('should generate random integers', () => {
    const value = DataGenerator.randomInt(1, 100);

    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(100);
    expect(Number.isInteger(value)).toBe(true);
  });

  it('should generate random floats', () => {
    const value = DataGenerator.randomFloat(0, 1, 2);

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
    expect(value.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });

  it('should generate random strings', () => {
    const str = DataGenerator.randomString(15);

    expect(str).toHaveLength(15);
    expect(str).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate random emails', () => {
    const email = DataGenerator.randomEmail();

    expect(email).toMatch(/^[a-z0-9]+@[a-z0-9]+\.com$/);
  });

  it('should generate random dates', () => {
    const start = new Date('2020-01-01');
    const end = new Date('2024-12-31');
    const date = DataGenerator.randomDate(start, end);

    expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('should select random element from array', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];
    const element = DataGenerator.randomElement(array);

    expect(array).toContain(element);
  });

  it('should generate random phone number', () => {
    const phone = DataGenerator.randomPhone();

    expect(phone).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/);
  });

  it('should generate random name', () => {
    const name = DataGenerator.randomName();

    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });

  it('should generate random address', () => {
    const address = DataGenerator.randomAddress();

    expect(address).toHaveProperty('street');
    expect(address).toHaveProperty('city');
    expect(address).toHaveProperty('state');
    expect(address).toHaveProperty('zip');
    expect(address.zip).toHaveLength(5);
  });
});

// ============================================================================
// 4. FIXTURES - Predefined Test Data Sets
// ============================================================================

class Fixtures {
  static users = {
    admin: {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      age: 35,
      role: 'admin' as const,
      createdAt: new Date('2020-01-01'),
      settings: {
        notifications: true,
        theme: 'dark' as const,
        language: 'en',
      },
    },
    normalUser: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Normal User',
      age: 28,
      role: 'user' as const,
      createdAt: new Date('2021-06-15'),
      settings: {
        notifications: true,
        theme: 'light' as const,
        language: 'en',
      },
    },
    inactiveUser: {
      id: 'user-2',
      email: 'inactive@example.com',
      name: 'Inactive User',
      age: 42,
      role: 'user' as const,
      createdAt: new Date('2019-03-20'),
      settings: {
        notifications: false,
        theme: 'light' as const,
        language: 'en',
      },
    },
  };

  static products = {
    laptop: {
      id: 'prod-laptop',
      name: 'Professional Laptop',
      description: 'High-performance laptop for professionals',
      price: 1299.99,
      category: 'electronics',
      tags: ['computer', 'portable', 'work'],
      inStock: true,
      rating: 4.7,
      reviews: 328,
    },
    headphones: {
      id: 'prod-headphones',
      name: 'Wireless Headphones',
      description: 'Premium noise-canceling headphones',
      price: 299.99,
      category: 'electronics',
      tags: ['audio', 'wireless', 'portable'],
      inStock: true,
      rating: 4.5,
      reviews: 892,
    },
    outOfStock: {
      id: 'prod-rare',
      name: 'Rare Collectible',
      description: 'Limited edition item',
      price: 599.99,
      category: 'collectibles',
      tags: ['rare', 'limited'],
      inStock: false,
      rating: 4.9,
      reviews: 15,
    },
  };

  static orders = [
    {
      id: 'order-1',
      userId: 'user-1',
      items: [
        { productId: 'prod-laptop', quantity: 1, price: 1299.99 },
        { productId: 'prod-headphones', quantity: 2, price: 299.99 },
      ],
      total: 1899.97,
      status: 'completed' as const,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'order-2',
      userId: 'user-1',
      items: [{ productId: 'prod-headphones', quantity: 1, price: 299.99 }],
      total: 299.99,
      status: 'pending' as const,
      createdAt: new Date('2024-02-20'),
    },
  ];
}

describe('Fixtures', () => {
  it('should use predefined user fixtures', () => {
    const admin = Fixtures.users.admin;

    expect(admin.role).toBe('admin');
    expect(admin.email).toBe('admin@example.com');
  });

  it('should use predefined product fixtures', () => {
    const laptop = Fixtures.products.laptop;

    expect(laptop.name).toBe('Professional Laptop');
    expect(laptop.inStock).toBe(true);
    expect(laptop.price).toBe(1299.99);
  });

  it('should use predefined order fixtures', () => {
    const order = Fixtures.orders[0];

    expect(order.userId).toBe('user-1');
    expect(order.items).toHaveLength(2);
    expect(order.total).toBe(1899.97);
  });

  it('should combine fixtures for complex scenarios', () => {
    const user = Fixtures.users.normalUser;
    const orders = Fixtures.orders.filter(o => o.userId === user.id);

    expect(orders).toHaveLength(2);
    expect(orders[0].status).toBe('completed');
  });
});

// ============================================================================
// 5. DATA SEEDING
// ============================================================================

class TestDatabase {
  private users: User[] = [];
  private products: Product[] = [];

  seedUsers(count: number = 10): User[] {
    const users = Array.from({ length: count }, (_, i) => ({
      id: `user-${i + 1}`,
      email: DataGenerator.randomEmail(),
      name: DataGenerator.randomName(),
      age: DataGenerator.randomInt(18, 80),
      role: DataGenerator.randomElement(['user', 'admin', 'moderator'] as const),
      createdAt: DataGenerator.randomDate(new Date('2020-01-01'), new Date()),
      settings: {
        notifications: DataGenerator.randomBoolean(),
        theme: DataGenerator.randomElement(['light', 'dark'] as const),
        language: 'en',
      },
    }));

    this.users.push(...users);
    return users;
  }

  seedProducts(count: number = 20): Product[] {
    const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
    const products = Array.from({ length: count }, (_, i) => ({
      id: `prod-${i + 1}`,
      name: `Product ${i + 1}`,
      description: `Description for product ${i + 1}`,
      price: DataGenerator.randomFloat(9.99, 999.99, 2),
      category: DataGenerator.randomElement(categories),
      tags: DataGenerator.randomElements(['popular', 'new', 'sale', 'featured'], 2),
      inStock: DataGenerator.randomBoolean(),
      rating: DataGenerator.randomFloat(3.0, 5.0, 1),
      reviews: DataGenerator.randomInt(0, 1000),
    }));

    this.products.push(...products);
    return products;
  }

  getUsers(): User[] {
    return this.users;
  }

  getProducts(): Product[] {
    return this.products;
  }

  clear(): void {
    this.users = [];
    this.products = [];
  }
}

describe('Data Seeding', () => {
  let db: TestDatabase;

  beforeEach(() => {
    db = new TestDatabase();
  });

  it('should seed users with random data', () => {
    const users = db.seedUsers(5);

    expect(users).toHaveLength(5);
    users.forEach(user => {
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        age: expect.any(Number),
      });
      expect(user.age).toBeGreaterThanOrEqual(18);
      expect(user.age).toBeLessThanOrEqual(80);
    });
  });

  it('should seed products with random data', () => {
    const products = db.seedProducts(10);

    expect(products).toHaveLength(10);
    products.forEach(product => {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
      });
      expect(product.price).toBeGreaterThanOrEqual(9.99);
      expect(product.price).toBeLessThanOrEqual(999.99);
    });
  });

  it('should generate diverse data', () => {
    const users = db.seedUsers(20);

    const roles = new Set(users.map(u => u.role));
    const themes = new Set(users.map(u => u.settings.theme));

    // Should have variety
    expect(roles.size).toBeGreaterThan(1);
    expect(themes.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// 6. COMPOSITE DATA GENERATION
// ============================================================================

interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

class OrderFactory {
  static create(
    user: User,
    products: Product[],
    itemCount: number = DataGenerator.randomInt(1, 5)
  ): Order {
    const selectedProducts = DataGenerator.randomElements(products, itemCount);

    const items = selectedProducts.map(product => ({
      productId: product.id,
      quantity: DataGenerator.randomInt(1, 3),
      price: product.price,
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      id: `order-${DataGenerator.randomString(8)}`,
      userId: user.id,
      items,
      total: Number(total.toFixed(2)),
      status: DataGenerator.randomElement(['pending', 'completed', 'cancelled'] as const),
      createdAt: DataGenerator.randomDate(user.createdAt, new Date()),
    };
  }

  static createMany(user: User, products: Product[], count: number): Order[] {
    return Array.from({ length: count }, () => this.create(user, products));
  }
}

describe('Composite Data Generation', () => {
  it('should create order from user and products', () => {
    const user = UserFactory.create();
    const products = [
      new ProductBuilder().withId('p1').withPrice(10.0).build(),
      new ProductBuilder().withId('p2').withPrice(20.0).build(),
    ];

    const order = OrderFactory.create(user, products);

    expect(order.userId).toBe(user.id);
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.items.length).toBeLessThanOrEqual(products.length);
    expect(order.total).toBeGreaterThan(0);
  });

  it('should create multiple orders for user', () => {
    const user = UserFactory.create();
    const products = Array.from({ length: 10 }, (_, i) =>
      new ProductBuilder().withId(`p${i}`).withPrice(10 + i).build()
    );

    const orders = OrderFactory.createMany(user, products, 5);

    expect(orders).toHaveLength(5);
    orders.forEach(order => {
      expect(order.userId).toBe(user.id);
      expect(order.createdAt.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime());
    });
  });

  it('should generate realistic order totals', () => {
    const user = UserFactory.create();
    const products = [
      new ProductBuilder().withPrice(100.0).build(),
      new ProductBuilder().withPrice(50.0).build(),
    ];

    const order = OrderFactory.create(user, products);

    // Recalculate total from items
    const expectedTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    expect(order.total).toBeCloseTo(expectedTotal, 2);
  });
});

// ============================================================================
// 7. SNAPSHOT DATA GENERATION
// ============================================================================

class SnapshotDataGenerator {
  static generateUserSnapshot(overrides?: Partial<User>): User {
    return {
      id: 'snapshot-user-1',
      email: 'snapshot@example.com',
      name: 'Snapshot User',
      age: 30,
      role: 'user',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      settings: {
        notifications: true,
        theme: 'light',
        language: 'en',
      },
      ...overrides,
    };
  }

  static generateProductSnapshot(): Product {
    return {
      id: 'snapshot-prod-1',
      name: 'Snapshot Product',
      description: 'A product for snapshot testing',
      price: 99.99,
      category: 'test',
      tags: ['snapshot', 'test'],
      inStock: true,
      rating: 4.5,
      reviews: 100,
    };
  }
}

describe('Snapshot Data Generation', () => {
  it('should generate consistent data for snapshots', () => {
    const user = SnapshotDataGenerator.generateUserSnapshot();

    expect(user).toMatchSnapshot();
  });

  it('should generate deterministic data', () => {
    const user1 = SnapshotDataGenerator.generateUserSnapshot();
    const user2 = SnapshotDataGenerator.generateUserSnapshot();

    expect(user1).toEqual(user2);
  });

  it('should allow overrides while maintaining consistency', () => {
    const user = SnapshotDataGenerator.generateUserSnapshot({
      name: 'Custom Name',
    });

    expect(user.name).toBe('Custom Name');
    expect(user.email).toBe('snapshot@example.com'); // Other fields consistent
  });
});

export {};
