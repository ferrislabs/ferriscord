import { create } from 'zustand'
import type { UserCardInfo } from '@/components/chat/user-profile-card'

interface ProfileCardStore {
  user: UserCardInfo | null
  anchorRect: DOMRect | null
  toggle: (user: UserCardInfo, e: React.MouseEvent) => void
  close: () => void
}

export const useProfileCardStore = create<ProfileCardStore>((set, get) => ({
  user: null,
  anchorRect: null,
  toggle: (user, e) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const current = get().user
    if (current?.id === user.id) {
      set({ user: null, anchorRect: null })
    } else {
      set({ user, anchorRect: rect })
    }
  },
  close: () => set({ user: null, anchorRect: null }),
}))
