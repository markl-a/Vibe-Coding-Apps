// Mock the database module before importing anything else
jest.mock('../../utils/db', () => require('../helpers/mockDb'));

const roomService = require('../../services/roomService');
const authService = require('../../services/authService');
const { clearMocks } = require('../helpers/mockDb');

describe('RoomService', () => {
  let user1, user2;

  beforeEach(async () => {
    clearMocks();
    const result1 = await authService.register('user1', 'user1@example.com', 'password123');
    const result2 = await authService.register('user2', 'user2@example.com', 'password123');
    user1 = result1.user;
    user2 = result2.user;
  });

  describe('createRoom', () => {
    it('should create a new room successfully', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'A test room', 'group');

      expect(room).toHaveProperty('id');
      expect(room.name).toBe('Test Room');
      expect(room.description).toBe('A test room');
      expect(room.type).toBe('group');
      expect(room.created_by).toBe(user1.id);
    });

    it('should add creator as room member', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'A test room');

      const retrievedRoom = await roomService.getRoomById(room.id, user1.id);
      expect(retrievedRoom).toBeTruthy();
    });

    it('should create room with default type as group', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');

      expect(room.type).toBe('group');
    });

    it('should create direct room', async () => {
      const room = await roomService.createRoom(user1.id, 'Direct Chat', null, 'direct');

      expect(room.type).toBe('direct');
    });
  });

  describe('getRoomById', () => {
    it('should return room if user is a member', async () => {
      const createdRoom = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      const room = await roomService.getRoomById(createdRoom.id, user1.id);

      expect(room.id).toBe(createdRoom.id);
      expect(room.name).toBe('Test Room');
    });

    it('should throw error if room not found', async () => {
      await expect(
        roomService.getRoomById('non-existent-id', user1.id)
      ).rejects.toThrow('Room not found');
    });

    it('should throw error if user is not a member', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');

      await expect(
        roomService.getRoomById(room.id, user2.id)
      ).rejects.toThrow('You are not a member of this room');
    });
  });

  describe('getUserRooms', () => {
    it('should return all rooms for a user', async () => {
      await roomService.createRoom(user1.id, 'Room 1', 'Description 1');
      await roomService.createRoom(user1.id, 'Room 2', 'Description 2');

      const rooms = await roomService.getUserRooms(user1.id);

      expect(rooms).toHaveLength(2);
      expect(rooms[0].name).toBe('Room 2'); // Most recent first
      expect(rooms[1].name).toBe('Room 1');
    });

    it('should return empty array if user has no rooms', async () => {
      const rooms = await roomService.getUserRooms(user2.id);

      expect(rooms).toHaveLength(0);
    });

    it('should include rooms user joined but did not create', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      await roomService.joinRoom(room.id, user2.id);

      const rooms = await roomService.getUserRooms(user2.id);

      expect(rooms).toHaveLength(1);
      expect(rooms[0].id).toBe(room.id);
    });
  });

  describe('joinRoom', () => {
    it('should allow user to join a room', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      const result = await roomService.joinRoom(room.id, user2.id);

      expect(result).toBe(true);

      // Verify user can now access the room
      const retrievedRoom = await roomService.getRoomById(room.id, user2.id);
      expect(retrievedRoom).toBeTruthy();
    });

    it('should throw error if user already a member', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      await roomService.joinRoom(room.id, user2.id);

      await expect(
        roomService.joinRoom(room.id, user2.id)
      ).rejects.toThrow('Already a member of this room');
    });
  });

  describe('leaveRoom', () => {
    it('should allow user to leave a room', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      await roomService.joinRoom(room.id, user2.id);

      const result = await roomService.leaveRoom(room.id, user2.id);

      expect(result).toBe(true);

      // Verify user can no longer access the room
      await expect(
        roomService.getRoomById(room.id, user2.id)
      ).rejects.toThrow('You are not a member of this room');
    });
  });

  describe('inviteToRoom', () => {
    it('should allow room member to invite another user', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      const result = await roomService.inviteToRoom(room.id, user1.id, user2.id);

      expect(result).toBe(true);

      // Verify invited user can access the room
      const retrievedRoom = await roomService.getRoomById(room.id, user2.id);
      expect(retrievedRoom).toBeTruthy();
    });

    it('should throw error if inviter is not a member', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');

      await expect(
        roomService.inviteToRoom(room.id, user2.id, user1.id)
      ).rejects.toThrow('You are not a member of this room');
    });

    it('should throw error if invitee is already a member', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      await roomService.inviteToRoom(room.id, user1.id, user2.id);

      await expect(
        roomService.inviteToRoom(room.id, user1.id, user2.id)
      ).rejects.toThrow('User is already a member');
    });
  });

  describe('markRoomAsRead', () => {
    it('should mark room as read for user', async () => {
      const room = await roomService.createRoom(user1.id, 'Test Room', 'Description');
      const result = await roomService.markRoomAsRead(room.id, user1.id);

      expect(result).toBe(true);
    });
  });
});
