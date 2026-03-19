import { create } from 'zustand'

export interface IUser {
  avatar: string
  preferred_username: string
  email: string
  name: string
}

export interface UserState {
  isAuthenticated: boolean
  isLoading: boolean
  expiration: number | null
  user: IUser | null
  setLoading: (value: boolean) => void
  setAuthenticated: (value: boolean) => void
  setUser: (user: IUser | null) => void
  setExpiration: (expiration: number | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  expiration: null,
  user: null,
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setUser: (user) => set({ user }),
  setExpiration: (expiration) => set({ expiration }),
}))
