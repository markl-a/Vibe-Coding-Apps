# Real-time Chat REST API

A modern, scalable real-time chat API built with Express.js, Socket.io, and PostgreSQL. This API provides both REST endpoints and WebSocket support for building real-time messaging applications.

## Features

- 🔐 **Authentication**: JWT-based user authentication
- 💬 **Real-time Messaging**: Socket.io integration for instant message delivery
- 🏠 **Room Management**: Create, join, and manage chat rooms
- 👥 **User Presence**: Track online/offline status
- ✅ **Read Receipts**: Message and room read status tracking
- 📁 **File Support**: Send messages with file attachments
- ⌨️ **Typing Indicators**: Real-time typing status
- 🧪 **Well Tested**: Comprehensive test suite with 20+ test cases

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Testing**: Jest, Supertest, Socket.io-client

## Project Structure

```
real-time-chat/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middlewares/       # Express middlewares
│   ├── sockets/           # Socket.io handlers
│   ├── utils/             # Utility functions
│   ├── __tests__/         # Test files
│   │   ├── controllers/   # Controller tests
│   │   ├── services/      # Service tests
│   │   ├── sockets/       # Socket.io tests
│   │   ├── integration/   # Integration tests
│   │   └── helpers/       # Test helpers and mocks
│   └── index.js           # Application entry point
├── package.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 16
- PostgreSQL >= 12

### Installation

1. Clone the repository and navigate to the project directory:

```bash
cd apis-backend/rest-api/real-time-chat
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=realtime_chat
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

5. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Rooms

#### Create Room
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "General",
  "description": "General discussion",
  "type": "group"
}
```

#### Get User Rooms
```http
GET /api/rooms
Authorization: Bearer <token>
```

#### Join Room
```http
POST /api/rooms/:roomId/join
Authorization: Bearer <token>
```

#### Leave Room
```http
POST /api/rooms/:roomId/leave
Authorization: Bearer <token>
```

#### Invite to Room
```http
POST /api/rooms/:roomId/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id-here"
}
```

### Messages

#### Send Message
```http
POST /api/rooms/:roomId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello, world!",
  "messageType": "text"
}
```

#### Get Messages
```http
GET /api/rooms/:roomId/messages?limit=50&offset=0
Authorization: Bearer <token>
```

#### Mark Message as Read
```http
POST /api/messages/:messageId/read
Authorization: Bearer <token>
```

#### Delete Message
```http
DELETE /api/messages/:messageId
Authorization: Bearer <token>
```

## WebSocket Events

### Client to Server

- `room:join` - Join a room
- `room:leave` - Leave a room
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Server to Client

- `room:joined` - Confirmation of room join
- `room:left` - Confirmation of room leave
- `message:new` - New message received
- `typing:started` - User started typing
- `typing:stopped` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `user:joined` - User joined the room
- `user:left` - User left the room

### Example Socket.io Client Usage

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join a room
socket.emit('room:join', { roomId: 'room-id' });

// Send a message
socket.emit('message:send', {
  roomId: 'room-id',
  content: 'Hello!'
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Listen for typing indicators
socket.on('typing:started', (data) => {
  console.log(`User ${data.userId} is typing...`);
});
```

## Testing

This project includes a comprehensive test suite with 20+ test cases covering:

- Authentication (register, login, JWT validation)
- Room management (create, join, leave, invite)
- Message operations (send, receive, read status, delete)
- Socket.io events (connection, disconnection, real-time events)
- Integration tests (complete chat flows)
- Permission and access control
- Error handling

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite includes:

- **13 AuthService tests**: Registration, login, profile management
- **10 RoomService tests**: Room creation, joining, leaving, invitations
- **9 MessageService tests**: Message sending, retrieval, read status
- **6 AuthController tests**: HTTP endpoint testing
- **8 RoomController tests**: Room API endpoint testing
- **11 Socket.io tests**: Connection, messaging, typing indicators
- **10 Integration tests**: Complete chat flows and edge cases

**Total: 67+ test cases**

## Database Schema

### Users
- id (UUID, Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- display_name
- avatar_url
- online_status
- last_seen
- created_at, updated_at

### Rooms
- id (UUID, Primary Key)
- name
- description
- type (group/direct)
- created_by (Foreign Key -> Users)
- created_at, updated_at

### Room Members
- id (UUID, Primary Key)
- room_id (Foreign Key -> Rooms)
- user_id (Foreign Key -> Users)
- joined_at
- last_read_at

### Messages
- id (UUID, Primary Key)
- room_id (Foreign Key -> Rooms)
- user_id (Foreign Key -> Users)
- content
- message_type (text/file/image)
- file_url
- created_at, updated_at

### Message Reads
- id (UUID, Primary Key)
- message_id (Foreign Key -> Messages)
- user_id (Foreign Key -> Users)
- read_at

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Helmet for security headers
- Input validation
- SQL injection prevention (parameterized queries)

## Performance Considerations

- Connection pooling for PostgreSQL
- Efficient message pagination
- Real-time event broadcasting optimization
- Graceful shutdown handling

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
