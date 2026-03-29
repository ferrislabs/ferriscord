import { create } from 'zustand'

const TYPING_TTL_MS = 5_000

export interface TypingUser {
  userId: string
  username: string
}

type RoomTypingMap = Record<string, TypingUser[]>

interface TypingState {
  typingByRoom: RoomTypingMap
  upsertTypingUser: (room: string, user: TypingUser) => void
  removeTypingUser: (room: string, userId: string) => void
  clearRoom: (room: string) => void
  clearAll: () => void
}

const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>()

function timerKey(room: string, userId: string) {
  return `${room}:${userId}`
}

function clearExpiry(room: string, userId: string) {
  const key = timerKey(room, userId)
  const timer = expiryTimers.get(key)
  if (timer) {
    clearTimeout(timer)
    expiryTimers.delete(key)
  }
}

export const useTypingStore = create<TypingState>((set) => ({
  typingByRoom: {},

  upsertTypingUser: (room, user) => {
    clearExpiry(room, user.userId)

    set((state) => {
      const users = state.typingByRoom[room] ?? []
      const existing = users.find((entry) => entry.userId === user.userId)
      if (existing && existing.username === user.username && users.length > 0) {
        return state
      }

      const nextUsers = existing
        ? users.map((entry) => (entry.userId === user.userId ? user : entry))
        : [...users, user]

      return {
        typingByRoom: {
          ...state.typingByRoom,
          [room]: nextUsers,
        },
      }
    })

    const key = timerKey(room, user.userId)
    expiryTimers.set(
      key,
      setTimeout(() => {
        expiryTimers.delete(key)
        useTypingStore.getState().removeTypingUser(room, user.userId)
      }, TYPING_TTL_MS),
    )
  },

  removeTypingUser: (room, userId) => {
    clearExpiry(room, userId)

    set((state) => {
      const users = state.typingByRoom[room] ?? []
      if (!users.some((entry) => entry.userId === userId)) {
        return state
      }
      const nextUsers = users.filter((entry) => entry.userId !== userId)
      if (nextUsers.length === 0) {
        const nextRooms = { ...state.typingByRoom }
        delete nextRooms[room]
        return { typingByRoom: nextRooms }
      }

      return {
        typingByRoom: {
          ...state.typingByRoom,
          [room]: nextUsers,
        },
      }
    })
  },

  clearRoom: (room) =>
    set((state) => {
      const users = state.typingByRoom[room] ?? []
      for (const user of users) {
        clearExpiry(room, user.userId)
      }
      if (!(room in state.typingByRoom)) return state
      const nextRooms = { ...state.typingByRoom }
      delete nextRooms[room]
      return { typingByRoom: nextRooms }
    }),

  clearAll: () =>
    set((state) => {
      for (const [room, users] of Object.entries(state.typingByRoom)) {
        for (const user of users) {
          clearExpiry(room, user.userId)
        }
      }
      return { typingByRoom: {} }
    }),
}))
