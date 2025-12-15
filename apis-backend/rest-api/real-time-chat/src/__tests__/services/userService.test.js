const userService = require('../../services/userService');

// Mock the database module
jest.mock('../../utils/db', () => require('../helpers/mockDb'));
const { clearMocks, mockUsers } = require('../helpers/mockDb');

describe('UserService', () => {
  beforeEach(() => {
    clearMocks();
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      // Add test users to mock database
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });
      mockUsers.set('user-2', {
        id: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        display_name: 'Bob',
        avatar_url: null,
        online_status: 'offline',
        last_seen: new Date().toISOString(),
      });

      const users = await userService.getUsers();

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('alice');
      expect(users[1].username).toBe('bob');
      expect(users[0].password).toBeUndefined();
    });

    it('should return empty array when no users exist', async () => {
      const users = await userService.getUsers();

      expect(users).toHaveLength(0);
      expect(Array.isArray(users)).toBe(true);
    });

    it('should not include password in returned users', async () => {
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const users = await userService.getUsers();

      expect(users[0].password).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userData = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      };
      mockUsers.set('user-1', { ...userData, password: 'hashed-password' });

      const user = await userService.getUserById('user-1');

      expect(user.id).toBe('user-1');
      expect(user.username).toBe('alice');
      expect(user.password).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      await expect(userService.getUserById('nonexistent-user')).rejects.toThrow(
        'User not found'
      );
    });

    it('should not include password in returned user', async () => {
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const user = await userService.getUserById('user-1');

      expect(user.password).toBeUndefined();
    });
  });

  describe('getOnlineUsers', () => {
    it('should return only online users', async () => {
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });
      mockUsers.set('user-2', {
        id: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        display_name: 'Bob',
        avatar_url: null,
        online_status: 'offline',
        last_seen: new Date().toISOString(),
      });
      mockUsers.set('user-3', {
        id: 'user-3',
        username: 'charlie',
        email: 'charlie@example.com',
        display_name: 'Charlie',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const onlineUsers = await userService.getOnlineUsers();

      expect(onlineUsers).toHaveLength(2);
      expect(onlineUsers.every((u) => u.online_status === 'online')).toBe(true);
      expect(onlineUsers.some((u) => u.username === 'alice')).toBe(true);
      expect(onlineUsers.some((u) => u.username === 'charlie')).toBe(true);
      expect(onlineUsers.some((u) => u.username === 'bob')).toBe(false);
    });

    it('should return empty array when no users are online', async () => {
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'offline',
        last_seen: new Date().toISOString(),
      });

      const onlineUsers = await userService.getOnlineUsers();

      expect(onlineUsers).toHaveLength(0);
    });

    it('should not include password in returned online users', async () => {
      mockUsers.set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const onlineUsers = await userService.getOnlineUsers();

      expect(onlineUsers[0].password).toBeUndefined();
    });
  });

  describe('updateOnlineStatus', () => {
    it('should update user online status to online', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'offline',
        last_seen: new Date(Date.now() - 10000).toISOString(),
      });

      const result = await userService.updateOnlineStatus(userId, 'online');

      expect(result).toBe(true);
      const user = mockUsers.get(userId);
      expect(user.online_status).toBe('online');
    });

    it('should update user online status to offline', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const result = await userService.updateOnlineStatus(userId, 'offline');

      expect(result).toBe(true);
      const user = mockUsers.get(userId);
      expect(user.online_status).toBe('offline');
    });

    it('should update last_seen timestamp', async () => {
      const userId = 'user-1';
      const oldTimestamp = new Date(Date.now() - 10000).toISOString();
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'offline',
        last_seen: oldTimestamp,
      });

      await userService.updateOnlineStatus(userId, 'online');

      const user = mockUsers.get(userId);
      expect(user.last_seen).not.toBe(oldTimestamp);
    });

    it('should handle away status', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const result = await userService.updateOnlineStatus(userId, 'away');

      expect(result).toBe(true);
      const user = mockUsers.get(userId);
      expect(user.online_status).toBe('away');
    });
  });

  describe('updateProfile', () => {
    it('should update display_name', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const updatedUser = await userService.updateProfile(userId, {
        display_name: 'Alice Smith',
      });

      expect(updatedUser.display_name).toBe('Alice Smith');
      expect(updatedUser.username).toBe('alice');
    });

    it('should update avatar_url', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const updatedUser = await userService.updateProfile(userId, {
        avatar_url: 'https://example.com/avatar.jpg',
      });

      expect(updatedUser.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should update both display_name and avatar_url', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const updatedUser = await userService.updateProfile(userId, {
        display_name: 'Alice Smith',
        avatar_url: 'https://example.com/avatar.jpg',
      });

      expect(updatedUser.display_name).toBe('Alice Smith');
      expect(updatedUser.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should throw error when no fields to update', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      await expect(userService.updateProfile(userId, {})).rejects.toThrow(
        'No fields to update'
      );
    });

    it('should allow updating display_name to empty string', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const updatedUser = await userService.updateProfile(userId, {
        display_name: '',
      });

      expect(updatedUser.display_name).toBe('');
    });

    it('should not update username or email', async () => {
      const userId = 'user-1';
      mockUsers.set(userId, {
        id: userId,
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice',
        avatar_url: null,
        online_status: 'online',
        last_seen: new Date().toISOString(),
      });

      const updatedUser = await userService.updateProfile(userId, {
        display_name: 'New Name',
        username: 'newalice', // Should be ignored
        email: 'newemail@example.com', // Should be ignored
      });

      expect(updatedUser.username).toBe('alice');
      expect(updatedUser.email).toBe('alice@example.com');
      expect(updatedUser.display_name).toBe('New Name');
    });
  });
});
