import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useGuildChannels(guildId: string | null | undefined) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    ...window.tanstackApi.get('/guilds/{guild_id}/channels', {
      path: { guild_id: guildId! },
    }).queryOptions,
    enabled: isAuthenticated && !!accessToken && !!guildId,
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'post',
    '/guilds/{guild_id}/channels',
  )

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/guilds/{guild_id}/channels' }],
      })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'patch',
    '/guilds/{guild_id}/channels/{channel_id}',
  )

  return useMutation({
    ...mutationOptions,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/guilds/{guild_id}/channels' }],
      })
    },
  })
}
