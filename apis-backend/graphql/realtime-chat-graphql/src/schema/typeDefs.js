const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String
    avatarUrl: String
    onlineStatus: String!
    lastSeen: String!
    createdAt: String!
  }

  type Room {
    id: ID!
    name: String!
    description: String
    type: String!
    createdBy: User!
    members: [RoomMember!]!
    membersCount: Int!
    lastMessage: Message
    unreadCount: Int!
    createdAt: String!
  }

  type RoomMember {
    id: ID!
    user: User!
    room: Room!
    joinedAt: String!
    lastReadAt: String!
  }

  type Message {
    id: ID!
    content: String!
    messageType: String!
    fileUrl: String
    sender: User!
    room: Room!
    readBy: [MessageRead!]!
    isReadByMe: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type MessageRead {
    id: ID!
    user: User!
    message: Message!
    readAt: String!
  }

  type TypingIndicator {
    user: User!
    room: Room!
    isTyping: Boolean!
  }

  type UserStatus {
    user: User!
    status: String!
    lastSeen: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # 用戶相關
    me: User
    users: [User!]!
    user(id: ID!): User
    onlineUsers: [User!]!

    # 聊天室
    myRooms: [Room!]!
    room(id: ID!): Room
    directRoom(userId: ID!): Room

    # 訊息
    messages(roomId: ID!, limit: Int, offset: Int): [Message!]!
    unreadMessagesCount: Int!
  }

  type Mutation {
    # 認證
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # 聊天室管理
    createRoom(name: String!, description: String, type: String): Room!
    joinRoom(roomId: ID!): Boolean!
    leaveRoom(roomId: ID!): Boolean!
    inviteToRoom(roomId: ID!, userId: ID!): Boolean!

    # 訊息
    sendMessage(roomId: ID!, content: String!, messageType: String, fileUrl: String): Message!
    markMessageAsRead(messageId: ID!): Boolean!
    markRoomAsRead(roomId: ID!): Boolean!

    # 用戶狀態
    setOnlineStatus(status: String!): Boolean!
    setTyping(roomId: ID!, isTyping: Boolean!): Boolean!
  }

  type Subscription {
    # 新訊息（指定聊天室）
    messageReceived(roomId: ID!): Message!

    # 用戶狀態變更
    userStatusChanged(userId: ID): UserStatus!

    # 輸入提示
    userTyping(roomId: ID!): TypingIndicator!

    # 聊天室更新
    roomUpdated(roomId: ID!): Room!
  }
`;

module.exports = typeDefs;
