import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/user.store'

export function useUserGuilds() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  return useQuery({
    ...window.tanstackApi.get('/users/@me/guilds').queryOptions,
    enabled: isAuthenticated,
  })
}
