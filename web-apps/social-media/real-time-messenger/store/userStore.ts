import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserState, User } from '@/types'

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      setCurrentUser: (user) =>
        set({
          currentUser: user,
          isAuthenticated: !!user,
        }),

      logout: () =>
        set({
          currentUser: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
