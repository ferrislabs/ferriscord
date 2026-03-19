import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useChannelMessages(
  guildId: string | null | undefined,
  channelId: string | null | undefined,
) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    ...window.tanstackApi.get(
      '/guilds/{guild_id}/channels/{channel_id}/messages',
      {
        path: { guild_id: guildId!, channel_id: channelId! },
      },
    ).queryOptions,
    enabled: isAuthenticated && !!accessToken && !!guildId && !!channelId,
  })
}
