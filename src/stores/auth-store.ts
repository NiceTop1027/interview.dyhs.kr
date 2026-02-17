import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<boolean>
  loginWithCode: (code: string, name: string) => Promise<{ success: boolean; examId?: string; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        })
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true })
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          }

          set({ isLoading: false })
          return false
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      loginWithCode: async (code, name) => {
        try {
          set({ isLoading: true })
          const res = await fetch('/api/auth/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name }),
          })

          const data = await res.json()

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true, examId: data.examId }
          }

          set({ isLoading: false })
          return { success: false, error: data.error }
        } catch (error) {
          console.error('Code login error:', error)
          set({ isLoading: false })
          return { success: false, error: '서버 접속 중 오류가 발생했습니다.' }
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true })
          const res = await fetch('/api/auth/me')
          const data = await res.json()

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
