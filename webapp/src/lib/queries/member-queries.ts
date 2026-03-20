import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useGuildMembers(guildId: string | null | undefined) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    ...window.tanstackApi.get('/guilds/{guild_id}/members', {
      path: { guild_id: guildId! },
    }).queryOptions,
    enabled: isAuthenticated && !!accessToken && !!guildId,
  })
}
