import { create } from 'zustand'
import { wsClient } from '@/lib/ws'

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline'

const STORAGE_KEY = 'myPresenceStatus'

function loadStoredStatus(): PresenceStatus {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'online' || v === 'idle' || v === 'dnd' || v === 'offline') return v
  } catch {}
  return 'online'
}

const initialStatus = loadStoredStatus()
// Prime the WS client so the status is restored on the very first connection.
if (initialStatus !== 'online') {
  wsClient.setPresence(initialStatus)
}

interface PresenceState {
  myStatus: PresenceStatus
  userPresences: Record<string, PresenceStatus>
  setMyStatus: (status: PresenceStatus) => void
  updateUserPresence: (userId: string, status: PresenceStatus) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  myStatus: initialStatus,
  userPresences: {},
  setMyStatus: (status) => {
    set({ myStatus: status })
    try { localStorage.setItem(STORAGE_KEY, status) } catch {}
    wsClient.setPresence(status)
  },
  updateUserPresence: (userId, status) =>
    set((state) => ({
      userPresences: { ...state.userPresences, [userId]: status },
    })),
}))
