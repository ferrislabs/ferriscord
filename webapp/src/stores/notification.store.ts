import { create } from 'zustand'

type GuildMentionCounts = Record<string, number>
type DmUnreadCounts = Record<string, number>

interface NotificationState {
  guildMentionCounts: GuildMentionCounts
  dmUnreadCounts: DmUnreadCounts
  addGuildMention: (guildId: string) => void
  clearGuildMentions: (guildId: string) => void
  addDmUnread: (channelId: string) => void
  clearDmUnread: (channelId: string) => void
  clearAll: () => void
}

type PersistedNotificationState = Pick<
  NotificationState,
  'guildMentionCounts' | 'dmUnreadCounts'
>

const STORAGE_KEY = 'ferriscord:notifications'

function loadInitialState(): PersistedNotificationState {
  if (typeof window === 'undefined') {
    return { guildMentionCounts: {}, dmUnreadCounts: {} }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { guildMentionCounts: {}, dmUnreadCounts: {} }

    const parsed = JSON.parse(raw) as Partial<PersistedNotificationState>
    return {
      guildMentionCounts: parsed.guildMentionCounts ?? {},
      dmUnreadCounts: parsed.dmUnreadCounts ?? {},
    }
  } catch {
    return { guildMentionCounts: {}, dmUnreadCounts: {} }
  }
}

function persist(state: PersistedNotificationState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const initialState = loadInitialState()

export const useNotificationStore = create<NotificationState>((set) => ({
  guildMentionCounts: initialState.guildMentionCounts,
  dmUnreadCounts: initialState.dmUnreadCounts,

  addGuildMention: (guildId) =>
    set((state) => {
      const next = {
        ...state.guildMentionCounts,
        [guildId]: (state.guildMentionCounts[guildId] ?? 0) + 1,
      }
      persist({
        guildMentionCounts: next,
        dmUnreadCounts: state.dmUnreadCounts,
      })
      return { guildMentionCounts: next }
    }),

  clearGuildMentions: (guildId) =>
    set((state) => {
      if (!(guildId in state.guildMentionCounts)) return state
      const next = { ...state.guildMentionCounts }
      delete next[guildId]
      persist({
        guildMentionCounts: next,
        dmUnreadCounts: state.dmUnreadCounts,
      })
      return { guildMentionCounts: next }
    }),

  addDmUnread: (channelId) =>
    set((state) => {
      const next = {
        ...state.dmUnreadCounts,
        [channelId]: (state.dmUnreadCounts[channelId] ?? 0) + 1,
      }
      persist({
        guildMentionCounts: state.guildMentionCounts,
        dmUnreadCounts: next,
      })
      return { dmUnreadCounts: next }
    }),

  clearDmUnread: (channelId) =>
    set((state) => {
      if (!(channelId in state.dmUnreadCounts)) return state
      const next = { ...state.dmUnreadCounts }
      delete next[channelId]
      persist({
        guildMentionCounts: state.guildMentionCounts,
        dmUnreadCounts: next,
      })
      return { dmUnreadCounts: next }
    }),

  clearAll: () =>
    set(() => {
      const next = { guildMentionCounts: {}, dmUnreadCounts: {} }
      persist(next)
      return next
    }),
}))
