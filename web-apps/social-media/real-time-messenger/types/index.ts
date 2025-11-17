export interface User {
  id: string
  nickname: string
  joinedAt: Date
}

export interface Message {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  roomId: string
}

export interface Room {
  id: string
  name: string
  description?: string
  userCount: number
}

export interface TypingUser {
  userId: string
  username: string
  roomId: string
}

export interface ChatState {
  currentRoom: Room | null
  rooms: Room[]
  messages: Message[]
  onlineUsers: User[]
  typingUsers: TypingUser[]
  setCurrentRoom: (room: Room | null) => void
  setRooms: (rooms: Room[]) => void
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setOnlineUsers: (users: User[]) => void
  addTypingUser: (user: TypingUser) => void
  removeTypingUser: (userId: string) => void
  clearMessages: () => void
}

export interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  setCurrentUser: (user: User | null) => void
  logout: () => void
}

export type SocketEvent =
  | 'connect'
  | 'disconnect'
  | 'user:joined'
  | 'user:left'
  | 'message:new'
  | 'message:send'
  | 'typing:start'
  | 'typing:stop'
  | 'room:join'
  | 'room:leave'
  | 'room:list'
  | 'users:online'
