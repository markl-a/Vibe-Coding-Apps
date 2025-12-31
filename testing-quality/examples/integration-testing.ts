/**
 * Integration Testing Examples with Vitest/Jest
 *
 * This file demonstrates integration testing patterns that test multiple
 * components working together, including API integration, database operations,
 * and service layer interactions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// ============================================================================
// 1. API INTEGRATION TESTS
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Authentication service that integrates with an API
 */
class AuthService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    return data;
  }

  async logout(): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
    });

    this.token = null;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }
}

describe('AuthService - API Integration', () => {
  let authService: AuthService;
  const mockBaseUrl = 'https://api.example.com';

  beforeEach(() => {
    authService = new AuthService(mockBaseUrl);
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user' as const,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.login('user@example.com', 'password123');

      expect(result).toEqual(mockResponse);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getToken()).toBe('mock-jwt-token');
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
        })
      );
    });

    it('should handle login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(authService.login('wrong@example.com', 'wrong')).rejects.toThrow('Login failed');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user' as const,
      };

      global.fetch = vi.fn()
        // First call for login
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'mock-token', user: mockUser }),
        })
        // Second call for getCurrentUser
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

      await authService.login('user@example.com', 'password123');
      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(fetch).toHaveBeenLastCalledWith(
        `${mockBaseUrl}/auth/me`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-token' },
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      await expect(authService.getCurrentUser()).rejects.toThrow('Not authenticated');
    });
  });
});

// ============================================================================
// 2. DATABASE INTEGRATION TESTS
// ============================================================================

/**
 * Simple in-memory database simulation
 */
class Database {
  private data: Map<string, any[]> = new Map();
  private connected: boolean = false;

  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.data.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async insert(table: string, record: any): Promise<any> {
    if (!this.connected) throw new Error('Database not connected');

    if (!this.data.has(table)) {
      this.data.set(table, []);
    }

    const id = Math.random().toString(36).substr(2, 9);
    const recordWithId = { ...record, id };
    this.data.get(table)!.push(recordWithId);
    return recordWithId;
  }

  async findById(table: string, id: string): Promise<any | null> {
    if (!this.connected) throw new Error('Database not connected');

    const records = this.data.get(table) || [];
    return records.find(r => r.id === id) || null;
  }

  async findAll(table: string, filter?: (record: any) => boolean): Promise<any[]> {
    if (!this.connected) throw new Error('Database not connected');

    const records = this.data.get(table) || [];
    return filter ? records.filter(filter) : records;
  }

  async update(table: string, id: string, updates: any): Promise<any | null> {
    if (!this.connected) throw new Error('Database not connected');

    const records = this.data.get(table) || [];
    const index = records.findIndex(r => r.id === id);

    if (index === -1) return null;

    records[index] = { ...records[index], ...updates };
    return records[index];
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (!this.connected) throw new Error('Database not connected');

    const records = this.data.get(table);
    if (!records) return false;

    const index = records.findIndex(r => r.id === id);
    if (index === -1) return false;

    records.splice(index, 1);
    return true;
  }
}

/**
 * User repository that uses the database
 */
class UserRepository {
  constructor(private db: Database) {}

  async createUser(email: string, name: string): Promise<User> {
    const user = await this.db.insert('users', {
      email,
      name,
      role: 'user',
      createdAt: new Date(),
    });
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.findById('users', id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.db.findAll('users', (u) => u.email === email);
    return users[0] || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.db.update('users', id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.db.delete('users', id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.findAll('users');
  }
}

describe('UserRepository - Database Integration', () => {
  let db: Database;
  let userRepo: UserRepository;

  beforeAll(async () => {
    db = new Database();
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await db.disconnect();
    await db.connect();
    userRepo = new UserRepository(db);
  });

  describe('createUser', () => {
    it('should create a new user in the database', async () => {
      const user = await userRepo.createUser('test@example.com', 'Test User');

      expect(user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should persist user across operations', async () => {
      const created = await userRepo.createUser('test@example.com', 'Test User');
      const fetched = await userRepo.getUserById(created.id);

      expect(fetched).toEqual(created);
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      await userRepo.createUser('test@example.com', 'Test User');
      const user = await userRepo.getUserByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepo.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const user = await userRepo.createUser('test@example.com', 'Test User');
      const updated = await userRepo.updateUser(user.id, { name: 'Updated Name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.email).toBe('test@example.com');
    });

    it('should persist updates', async () => {
      const user = await userRepo.createUser('test@example.com', 'Test User');
      await userRepo.updateUser(user.id, { name: 'Updated Name' });
      const fetched = await userRepo.getUserById(user.id);

      expect(fetched?.name).toBe('Updated Name');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const user = await userRepo.createUser('test@example.com', 'Test User');
      const deleted = await userRepo.deleteUser(user.id);

      expect(deleted).toBe(true);

      const fetched = await userRepo.getUserById(user.id);
      expect(fetched).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await userRepo.deleteUser('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      await userRepo.createUser('user1@example.com', 'User 1');
      await userRepo.createUser('user2@example.com', 'User 2');
      await userRepo.createUser('user3@example.com', 'User 3');

      const users = await userRepo.getAllUsers();
      expect(users).toHaveLength(3);
    });

    it('should return empty array when no users', async () => {
      const users = await userRepo.getAllUsers();
      expect(users).toEqual([]);
    });
  });
});

// ============================================================================
// 3. SERVICE LAYER INTEGRATION TESTS
// ============================================================================

interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class BlogService {
  constructor(
    private userRepo: UserRepository,
    private db: Database
  ) {}

  async createPost(authorId: string, title: string, content: string): Promise<BlogPost> {
    // Verify author exists
    const author = await this.userRepo.getUserById(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    const post = await this.db.insert('posts', {
      title,
      content,
      authorId,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return post;
  }

  async publishPost(postId: string): Promise<BlogPost> {
    const post = await this.db.findById('posts', postId);
    if (!post) {
      throw new Error('Post not found');
    }

    return this.db.update('posts', postId, {
      published: true,
      updatedAt: new Date(),
    });
  }

  async getPostsWithAuthors(): Promise<Array<BlogPost & { author: User }>> {
    const posts = await this.db.findAll('posts');
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await this.userRepo.getUserById(post.authorId);
        return { ...post, author };
      })
    );

    return postsWithAuthors;
  }

  async getUserPosts(userId: string): Promise<BlogPost[]> {
    return this.db.findAll('posts', (post) => post.authorId === userId);
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.db.findById('posts', postId);
    if (!post) {
      return false;
    }

    // Only author can delete
    if (post.authorId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.db.delete('posts', postId);
  }
}

describe('BlogService - Service Layer Integration', () => {
  let db: Database;
  let userRepo: UserRepository;
  let blogService: BlogService;
  let testUser: User;

  beforeAll(async () => {
    db = new Database();
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // Reset database
    await db.disconnect();
    await db.connect();

    userRepo = new UserRepository(db);
    blogService = new BlogService(userRepo, db);

    // Create a test user for posts
    testUser = await userRepo.createUser('author@example.com', 'Test Author');
  });

  describe('createPost', () => {
    it('should create a post with valid author', async () => {
      const post = await blogService.createPost(
        testUser.id,
        'Test Post',
        'This is test content'
      );

      expect(post).toMatchObject({
        title: 'Test Post',
        content: 'This is test content',
        authorId: testUser.id,
        published: false,
      });
      expect(post.id).toBeDefined();
    });

    it('should reject post with non-existent author', async () => {
      await expect(
        blogService.createPost('invalid-id', 'Test', 'Content')
      ).rejects.toThrow('Author not found');
    });
  });

  describe('publishPost', () => {
    it('should publish a draft post', async () => {
      const post = await blogService.createPost(testUser.id, 'Draft Post', 'Content');
      expect(post.published).toBe(false);

      const published = await blogService.publishPost(post.id);
      expect(published.published).toBe(true);
    });

    it('should reject publishing non-existent post', async () => {
      await expect(blogService.publishPost('invalid-id')).rejects.toThrow('Post not found');
    });
  });

  describe('getPostsWithAuthors', () => {
    it('should fetch posts with author information', async () => {
      await blogService.createPost(testUser.id, 'Post 1', 'Content 1');
      await blogService.createPost(testUser.id, 'Post 2', 'Content 2');

      const posts = await blogService.getPostsWithAuthors();

      expect(posts).toHaveLength(2);
      expect(posts[0].author).toEqual(testUser);
      expect(posts[1].author).toEqual(testUser);
    });

    it('should handle multiple authors', async () => {
      const user2 = await userRepo.createUser('author2@example.com', 'Author 2');

      await blogService.createPost(testUser.id, 'Post 1', 'Content 1');
      await blogService.createPost(user2.id, 'Post 2', 'Content 2');

      const posts = await blogService.getPostsWithAuthors();

      expect(posts).toHaveLength(2);
      expect(posts[0].author.id).toBe(testUser.id);
      expect(posts[1].author.id).toBe(user2.id);
    });
  });

  describe('getUserPosts', () => {
    it('should get all posts for a specific user', async () => {
      const user2 = await userRepo.createUser('author2@example.com', 'Author 2');

      await blogService.createPost(testUser.id, 'User 1 Post 1', 'Content');
      await blogService.createPost(testUser.id, 'User 1 Post 2', 'Content');
      await blogService.createPost(user2.id, 'User 2 Post', 'Content');

      const user1Posts = await blogService.getUserPosts(testUser.id);
      expect(user1Posts).toHaveLength(2);

      const user2Posts = await blogService.getUserPosts(user2.id);
      expect(user2Posts).toHaveLength(1);
    });
  });

  describe('deletePost', () => {
    it('should allow author to delete their post', async () => {
      const post = await blogService.createPost(testUser.id, 'Post', 'Content');
      const deleted = await blogService.deletePost(post.id, testUser.id);

      expect(deleted).toBe(true);

      const posts = await blogService.getUserPosts(testUser.id);
      expect(posts).toHaveLength(0);
    });

    it('should prevent non-author from deleting post', async () => {
      const user2 = await userRepo.createUser('other@example.com', 'Other User');
      const post = await blogService.createPost(testUser.id, 'Post', 'Content');

      await expect(
        blogService.deletePost(post.id, user2.id)
      ).rejects.toThrow('Unauthorized');
    });

    it('should return false for non-existent post', async () => {
      const deleted = await blogService.deletePost('invalid-id', testUser.id);
      expect(deleted).toBe(false);
    });
  });
});

// ============================================================================
// 4. EVENT-DRIVEN INTEGRATION TESTS
// ============================================================================

type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async emit(event: string, data: any): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map(handler => handler(data)));
  }
}

class NotificationService {
  private notifications: Array<{ userId: string; message: string; type: string }> = [];

  constructor(private eventBus: EventBus) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.on('user.created', async (user: User) => {
      this.notifications.push({
        userId: user.id,
        message: `Welcome, ${user.name}!`,
        type: 'welcome',
      });
    });

    this.eventBus.on('post.published', async (post: BlogPost) => {
      this.notifications.push({
        userId: post.authorId,
        message: `Your post "${post.title}" has been published!`,
        type: 'post_published',
      });
    });
  }

  getNotifications(userId: string): Array<{ message: string; type: string }> {
    return this.notifications.filter(n => n.userId === userId);
  }
}

describe('Event-Driven Integration', () => {
  let eventBus: EventBus;
  let notificationService: NotificationService;
  let db: Database;
  let userRepo: UserRepository;
  let blogService: BlogService;

  beforeEach(async () => {
    db = new Database();
    await db.connect();

    userRepo = new UserRepository(db);
    eventBus = new EventBus();
    notificationService = new NotificationService(eventBus);
    blogService = new BlogService(userRepo, db);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  it('should trigger notification when user is created', async () => {
    const user = await userRepo.createUser('test@example.com', 'Test User');
    await eventBus.emit('user.created', user);

    const notifications = notificationService.getNotifications(user.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      message: 'Welcome, Test User!',
      type: 'welcome',
    });
  });

  it('should trigger notification when post is published', async () => {
    const user = await userRepo.createUser('test@example.com', 'Test User');
    const post = await blogService.createPost(user.id, 'My First Post', 'Content');
    const published = await blogService.publishPost(post.id);

    await eventBus.emit('post.published', published);

    const notifications = notificationService.getNotifications(user.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      message: 'Your post "My First Post" has been published!',
      type: 'post_published',
    });
  });

  it('should handle multiple events for the same user', async () => {
    const user = await userRepo.createUser('test@example.com', 'Test User');
    await eventBus.emit('user.created', user);

    const post = await blogService.createPost(user.id, 'Post', 'Content');
    const published = await blogService.publishPost(post.id);
    await eventBus.emit('post.published', published);

    const notifications = notificationService.getNotifications(user.id);
    expect(notifications).toHaveLength(2);
  });
});

export {};
