import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { wsClient, type WsEvent } from '@/lib/ws'

export function useWsEvents() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const queryClient = useQueryClient()

  // Connect / disconnect when auth state changes.
  // No cleanup on token refresh — disconnect only happens on logout (!isAuthenticated).
  // Removing the cleanup prevents pendingRooms from being wiped on every silent token renewal.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      wsClient.disconnect()
      return
    }

    wsClient.connect(window.apiUrl ?? '', accessToken)
  }, [isAuthenticated, accessToken])

  // Listen to events and invalidate the right query caches
  useEffect(() => {
    const remove = wsClient.addListener((event: WsEvent) => {
      switch (event.type) {
        case 'message.new':
        case 'message.delete': {
          // room is either "channel:<uuid>" or "dm:<uuid>"
          const [kind, id] = event.room.split(':')
          if (kind === 'channel') {
            queryClient.invalidateQueries({
              queryKey: [{ _id: '/guilds/{guild_id}/channels/{channel_id}/messages' }],
            })
          } else if (kind === 'dm') {
            queryClient.invalidateQueries({
              queryKey: [{ _id: '/channels/@me/{channel_id}/messages', path: { channel_id: id } }],
            })
          }
          break
        }

        case 'friend_request.received':
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/friends/requests/incoming' }],
          })
          break

        case 'friend_request.accepted':
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/friends' }],
          })
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/friends/requests/outgoing' }],
          })
          break
      }
    })

    return remove
  }, [queryClient])
}

/**
 * Subscribe to a specific room while a component is mounted.
 * Call this from channel/DM pages.
 */
export function useWsRoom(room: string | null | undefined) {
  useEffect(() => {
    if (!room) return
    wsClient.subscribe([room])
    return () => wsClient.unsubscribe([room])
  }, [room])
}
