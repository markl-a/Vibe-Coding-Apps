import { create } from 'zustand';
import { User } from '../types';

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: {
    id: '1',
    name: '測試用戶',
    username: '@testuser',
    avatar: 'https://via.placeholder.com/150',
    bio: '這是一個測試用戶的個人簡介',
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
}));
