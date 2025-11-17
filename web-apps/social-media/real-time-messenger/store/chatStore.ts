import { create } from 'zustand'
import { ChatState, Message, Room, User, TypingUser } from '@/types'

export const useChatStore = create<ChatState>((set) => ({
  currentRoom: null,
  rooms: [],
  messages: [],
  onlineUsers: [],
  typingUsers: [],

  setCurrentRoom: (room) => set({ currentRoom: room }),

  setRooms: (rooms) => set({ rooms }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addTypingUser: (user) =>
    set((state) => {
      const exists = state.typingUsers.some((u) => u.userId === user.userId)
      if (exists) return state
      return { typingUsers: [...state.typingUsers, user] }
    }),

  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u.userId !== userId),
    })),

  clearMessages: () => set({ messages: [] }),
}))
