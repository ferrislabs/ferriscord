import { create } from 'zustand'

export type CryptoSetupStatus = 'unknown' | 'not_setup' | 'setup' | 'locked'

interface CryptoState {
  /** Whether E2EE keys are set up for the current user */
  setupStatus: CryptoSetupStatus
  setSetupStatus: (status: CryptoSetupStatus) => void

  /** Current device ID (registered with the server) */
  deviceId: string | null
  setDeviceId: (id: string | null) => void

  /** Whether the security password has been entered this session (keys are unlocked) */
  isUnlocked: boolean
  setUnlocked: (unlocked: boolean) => void

  /** DB user ID (UUID) for IndexedDB scoping */
  userId: string | null
  setUserId: (id: string | null) => void
}

export const useCryptoStore = create<CryptoState>((set) => ({
  setupStatus: 'unknown',
  setSetupStatus: (setupStatus) => set({ setupStatus }),

  deviceId: null,
  setDeviceId: (deviceId) => set({ deviceId }),

  isUnlocked: false,
  setUnlocked: (isUnlocked) => set({ isUnlocked }),

  userId: null,
  setUserId: (userId) => set({ userId }),
}))
