import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { wsClient, type WsEvent } from '@/lib/ws'
import { usePresenceStore, type PresenceStatus } from '@/stores/presence.store'

export function useWsEvents() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const queryClient = useQueryClient()

  // Connect / disconnect when auth state changes.
  // We pass a getter instead of the token value so that every automatic
  // reconnect reads the latest token from the store — this prevents the WS
  // from reconnecting with a stale, expired token after a silent OIDC refresh.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      wsClient.disconnect()
      return
    }

    wsClient.connect(window.apiUrl ?? '', () => useAuthStore.getState().accessToken)
  }, [isAuthenticated, accessToken])

  // On reconnect, invalidate all message queries so we catch anything missed
  // while the connection was down (e.g. a delete that fired during the gap).
  useEffect(() => {
    const remove = wsClient.addReconnectListener(() => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/guilds/{guild_id}/channels/{channel_id}/messages' }],
      })
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
      })
    })
    return remove
  }, [queryClient])

  // Listen to events and invalidate the right query caches
  useEffect(() => {
    const remove = wsClient.addListener((event: WsEvent) => {
      switch (event.type) {
        case 'message.new':
        case 'message.delete': {
          // room is either "channel:<uuid>" or "dm:<uuid>"
          const [kind, id] = event.room.split(':')
          if (kind === 'channel') {
            // Invalidate all channel message caches — the server broadcasts to the
            // specific room so only observers of that channel will refetch.
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

        case 'presence.update': {
          const data = event.data as { user_id: string; status: PresenceStatus }
          usePresenceStore.getState().updateUserPresence(data.user_id, data.status)
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/guilds/{guild_id}/members' }],
          })
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
