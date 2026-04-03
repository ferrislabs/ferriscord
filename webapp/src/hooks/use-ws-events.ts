import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { wsClient, type WsEvent } from '@/lib/ws'
import { usePresenceStore, type PresenceStatus } from '@/stores/presence.store'
import { containsMention } from '@/lib/mentions'
import { useNotificationStore } from '@/stores/notification.store'
import { useTypingStore } from '@/stores/typing.store'
import { cryptoKeys } from '@/lib/queries/crypto-queries'
import type { Schemas } from '@/api/api.client'

export function useWsEvents() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const authUser = useUserStore((s) => s.user)
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

    wsClient.connect(
      window.apiUrl ?? '',
      () => useAuthStore.getState().accessToken,
    )
  }, [isAuthenticated, accessToken])

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !window.tanstackApi) return

    let cancelled = false
    let rooms: string[] = []

    void queryClient
      .fetchQuery(window.tanstackApi.get('/users/@me/guilds').queryOptions)
      .then((guilds) => {
        if (cancelled) return
        rooms = (guilds as Array<{ id: string }>).map(
          (guild) => `guild:${guild.id}`,
        )
        if (rooms.length > 0) wsClient.subscribe(rooms)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (rooms.length > 0) wsClient.unsubscribe(rooms)
    }
  }, [isAuthenticated, accessToken, queryClient])

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !window.tanstackApi) return

    let cancelled = false
    let rooms: string[] = []

    void queryClient
      .fetchQuery(window.tanstackApi.get('/channels/@me').queryOptions)
      .then((dms) => {
        if (cancelled) return
        rooms = (dms as Array<{ id: string }>).map((dm) => `dm:${dm.id}`)
        if (rooms.length > 0) wsClient.subscribe(rooms)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (rooms.length > 0) wsClient.unsubscribe(rooms)
    }
  }, [isAuthenticated, accessToken, queryClient])

  // On reconnect, invalidate all message queries so we catch anything missed
  // while the connection was down (e.g. a delete that fired during the gap).
  useEffect(() => {
    const remove = wsClient.addReconnectListener(() => {
      queryClient.invalidateQueries({
        queryKey: [
          { _id: '/guilds/{guild_id}/channels/{channel_id}/messages' },
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
      })
    })
    return () => {
      remove()
    }
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
            if (event.type === 'message.new') {
              const message = event.data as Schemas.Message
              useTypingStore
                .getState()
                .removeTypingUser(event.room, message.author.id)
            }
            // Invalidate all channel message caches — the server broadcasts to the
            // specific room so only observers of that channel will refetch.
            queryClient.invalidateQueries({
              queryKey: [
                { _id: '/guilds/{guild_id}/channels/{channel_id}/messages' },
              ],
            })
          } else if (kind === 'guild' && event.type === 'message.new') {
            const message = event.data as Schemas.Message
            const pathname = window.location.pathname
            const currentGuildMatch = pathname.match(
              /^\/channels\/([^/]+)\/([^/]+)$/,
            )
            const activeGuildId = currentGuildMatch?.[1]
            const me = window.tanstackApi
              ? (queryClient.getQueryData(
                  window.tanstackApi.get('/users/@me').queryKey,
                ) as { id?: string; username?: string } | undefined)
              : undefined
            const myUsername = me?.username ?? authUser?.preferred_username
            const isOwnMessage =
              (me?.id != null && message.author.id === me.id) ||
              (!!authUser?.preferred_username &&
                message.author.username === authUser.preferred_username)
            const wasMentioned = containsMention(message.content, myUsername)

            if (!isOwnMessage && wasMentioned && id !== activeGuildId) {
              useNotificationStore.getState().addGuildMention(id)
            }
          } else if (kind === 'dm') {
            if (event.type === 'message.new') {
              const message = event.data as Schemas.Message
              useTypingStore
                .getState()
                .removeTypingUser(event.room, message.author.id)
            }
            queryClient.invalidateQueries({
              queryKey: [
                {
                  _id: '/channels/@me/{channel_id}/messages',
                  path: { channel_id: id },
                },
              ],
            })

            if (event.type === 'message.new') {
              const message = event.data as Schemas.Message
              const pathname = window.location.pathname
              const currentDmMatch = pathname.match(
                /^\/channels\/@me\/([^/]+)$/,
              )
              const activeDmId = currentDmMatch?.[1]
              const me = window.tanstackApi
                ? (queryClient.getQueryData(
                    window.tanstackApi.get('/users/@me').queryKey,
                  ) as { id?: string } | undefined)
                : undefined
              const isOwnMessage =
                (me?.id != null && message.author.id === me.id) ||
                (!!authUser?.preferred_username &&
                  message.author.username === authUser.preferred_username)

              if (!isOwnMessage && id !== activeDmId) {
                useNotificationStore.getState().addDmUnread(id)
              }
            }
          }
          break
        }

        case 'channel.updated': {
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/guilds/{guild_id}/channels' }],
          })
          queryClient.invalidateQueries({
            queryKey: [
              { _id: '/guilds/{guild_id}/channels/{channel_id}/messages' },
            ],
          })
          break
        }

        case 'typing.update': {
          const data = event.data as {
            user_id: string
            username: string
            is_typing: boolean
          }
          const me = window.tanstackApi
            ? (queryClient.getQueryData(
                window.tanstackApi.get('/users/@me').queryKey,
              ) as { id?: string; username?: string } | undefined)
            : undefined
          const isOwnEvent =
            (me?.id != null && data.user_id === me.id) ||
            (!!authUser?.preferred_username &&
              data.username === authUser.preferred_username)

          if (isOwnEvent) break

          if (data.is_typing) {
            useTypingStore.getState().upsertTypingUser(event.room, {
              userId: data.user_id,
              username: data.username,
            })
          } else {
            useTypingStore.getState().removeTypingUser(event.room, data.user_id)
          }
          break
        }

        case 'presence.update': {
          const data = event.data as { user_id: string; status: PresenceStatus }
          usePresenceStore
            .getState()
            .updateUserPresence(data.user_id, data.status)
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/guilds/{guild_id}/members' }],
          })
          break
        }

        case 'keys.updated': {
          // E2EE: sender keys changed for a channel — invalidate cached keys
          const keysData = event.data as { channel_id?: string }
          if (keysData.channel_id) {
            queryClient.invalidateQueries({
              queryKey: cryptoKeys.senderKeys(keysData.channel_id),
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

    return () => {
      remove()
    }
  }, [queryClient, authUser?.preferred_username])
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
