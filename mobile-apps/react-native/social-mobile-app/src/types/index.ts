export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: Date;
  liked?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  user: User;
  content: string;
  timestamp: Date;
  read: boolean;
}
