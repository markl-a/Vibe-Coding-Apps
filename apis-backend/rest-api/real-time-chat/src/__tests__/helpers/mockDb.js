// Mock database for testing

const mockUsers = new Map();
const mockRooms = new Map();
const mockRoomMembers = new Map();
const mockMessages = new Map();
const mockMessageReads = new Map();

let userIdCounter = 1;
let roomIdCounter = 1;
let messageIdCounter = 1;

// Mock query function
const mockQuery = jest.fn((sql, params) => {
  const sqlLower = sql.toLowerCase().trim();

  // CREATE TABLE queries
  if (sqlLower.includes('create table')) {
    return Promise.resolve({ rows: [] });
  }

  // INSERT INTO users
  if (sqlLower.includes('insert into users')) {
    const id = `user-${userIdCounter++}`;
    const user = {
      id,
      username: params[0],
      email: params[1],
      password: params[2],
      display_name: params[3],
      online_status: 'offline',
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockUsers.set(id, user);
    return Promise.resolve({ rows: [user] });
  }

  // SELECT users by email or username
  if (sqlLower.includes('select * from users where email') && sqlLower.includes('or username')) {
    const rows = Array.from(mockUsers.values()).filter(
      (u) => u.email === params[0] || u.username === params[1]
    );
    return Promise.resolve({ rows });
  }

  // SELECT users by email
  if (sqlLower.includes('select * from users where email')) {
    const rows = Array.from(mockUsers.values()).filter((u) => u.email === params[0]);
    return Promise.resolve({ rows });
  }

  // SELECT user by ID (with field selection)
  if (sqlLower.includes('select') && sqlLower.includes('from users where id')) {
    const user = mockUsers.get(params[0]);
    if (!user) return Promise.resolve({ rows: [] });

    // If selecting specific fields (not SELECT *), exclude password
    if (!sqlLower.includes('select *')) {
      const { password, ...userWithoutPassword } = user;
      return Promise.resolve({ rows: [userWithoutPassword] });
    }

    return Promise.resolve({ rows: [user] });
  }

  // UPDATE user online status
  if (sqlLower.includes('update users set online_status')) {
    const user = mockUsers.get(params[1]);
    if (user) {
      user.online_status = params[0];
      user.last_seen = new Date().toISOString();
    }
    return Promise.resolve({ rows: [] });
  }

  // INSERT INTO rooms
  if (sqlLower.includes('insert into rooms')) {
    const id = `room-${roomIdCounter++}`;
    const room = {
      id,
      name: params[0],
      description: params[1],
      type: params[2],
      created_by: params[3],
      created_at: new Date().toISOString(),
    };
    mockRooms.set(id, room);
    return Promise.resolve({ rows: [room] });
  }

  // SELECT room by ID
  if (sqlLower.includes('select * from rooms where id')) {
    const room = mockRooms.get(params[0]);
    return Promise.resolve({ rows: room ? [room] : [] });
  }

  // SELECT user rooms
  if (sqlLower.includes('select distinct r.* from rooms r') && sqlLower.includes('join room_members')) {
    const userRoomIds = Array.from(mockRoomMembers.values())
      .filter((m) => m.user_id === params[0])
      .map((m) => m.room_id);
    const rooms = Array.from(mockRooms.values())
      .filter((r) => userRoomIds.includes(r.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Most recent first
    return Promise.resolve({ rows: rooms });
  }

  // INSERT INTO room_members
  if (sqlLower.includes('insert into room_members')) {
    const id = `member-${Date.now()}-${Math.random()}`;
    const member = {
      id,
      room_id: params[0],
      user_id: params[1],
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    };

    // Check for duplicate
    const existing = Array.from(mockRoomMembers.values()).find(
      (m) => m.room_id === params[0] && m.user_id === params[1]
    );
    if (existing) {
      const error = new Error('duplicate key value');
      error.code = '23505';
      return Promise.reject(error);
    }

    mockRoomMembers.set(id, member);
    return Promise.resolve({ rows: [member] });
  }

  // SELECT room member
  if (sqlLower.includes('select id from room_members where room_id')) {
    const rows = Array.from(mockRoomMembers.values()).filter(
      (m) => m.room_id === params[0] && m.user_id === params[1]
    );
    return Promise.resolve({ rows });
  }

  // DELETE room member
  if (sqlLower.includes('delete from room_members')) {
    const toDelete = Array.from(mockRoomMembers.entries()).find(
      ([_, m]) => m.room_id === params[0] && m.user_id === params[1]
    );
    if (toDelete) {
      mockRoomMembers.delete(toDelete[0]);
    }
    return Promise.resolve({ rows: [] });
  }

  // INSERT INTO messages
  if (sqlLower.includes('insert into messages')) {
    const id = `message-${messageIdCounter++}`;
    const message = {
      id,
      room_id: params[0],
      user_id: params[1],
      content: params[2],
      message_type: params[3] || 'text',
      file_url: params[4],
      created_at: new Date().toISOString(),
    };
    mockMessages.set(id, message);
    return Promise.resolve({ rows: [message] });
  }

  // SELECT messages
  if (sqlLower.includes('select m.*, u.username') && sqlLower.includes('from messages m')) {
    const roomMessages = Array.from(mockMessages.values())
      .filter((m) => m.room_id === params[0])
      .slice(0, params[1])
      .map((m) => ({
        ...m,
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
      }));
    return Promise.resolve({ rows: roomMessages.reverse() });
  }

  // SELECT message by ID
  if (sqlLower.includes('select * from messages where id')) {
    const message = mockMessages.get(params[0]);
    return Promise.resolve({ rows: message ? [message] : [] });
  }

  // DELETE message
  if (sqlLower.includes('delete from messages where id')) {
    mockMessages.delete(params[0]);
    return Promise.resolve({ rows: [] });
  }

  // INSERT INTO message_reads
  if (sqlLower.includes('insert into message_reads')) {
    const id = `read-${Date.now()}-${Math.random()}`;
    const read = {
      id,
      message_id: params[0],
      user_id: params[1],
      read_at: new Date().toISOString(),
    };

    // Check for duplicate
    const existing = Array.from(mockMessageReads.values()).find(
      (r) => r.message_id === params[0] && r.user_id === params[1]
    );
    if (existing) {
      const error = new Error('duplicate key value');
      error.code = '23505';
      return Promise.reject(error);
    }

    mockMessageReads.set(id, read);
    return Promise.resolve({ rows: [read] });
  }

  // UPDATE room_members last_read_at
  if (sqlLower.includes('update room_members set last_read_at')) {
    const member = Array.from(mockRoomMembers.values()).find(
      (m) => m.room_id === params[0] && m.user_id === params[1]
    );
    if (member) {
      member.last_read_at = new Date().toISOString();
    }
    return Promise.resolve({ rows: [] });
  }

  // SELECT unread count
  if (sqlLower.includes('count') && (sqlLower.includes('unread') || sqlLower.includes('last_read_at'))) {
    return Promise.resolve({ rows: [{ count: '0' }] });
  }

  // Default response
  return Promise.resolve({ rows: [] });
});

const mockInitDatabase = jest.fn(() => Promise.resolve());

const clearMocks = () => {
  mockUsers.clear();
  mockRooms.clear();
  mockRoomMembers.clear();
  mockMessages.clear();
  mockMessageReads.clear();
  userIdCounter = 1;
  roomIdCounter = 1;
  messageIdCounter = 1;
  mockQuery.mockClear();
  mockInitDatabase.mockClear();
};

module.exports = {
  query: mockQuery,
  initDatabase: mockInitDatabase,
  pool: { end: jest.fn() },
  clearMocks,
  mockUsers,
  mockRooms,
  mockRoomMembers,
  mockMessages,
  mockMessageReads,
};
