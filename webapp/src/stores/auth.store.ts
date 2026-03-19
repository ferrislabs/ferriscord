import { create } from 'zustand'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  setTokens: (
    accessToken: string | null,
    refreshToken: string | null,
    idToken: string | null
  ) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  idToken: null,
  setTokens: (accessToken, refreshToken, idToken) =>
    set({ accessToken, refreshToken, idToken }),
}))
