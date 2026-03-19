import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useUserGuilds() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    ...window.tanstackApi.get('/users/@me/guilds').queryOptions,
    enabled: isAuthenticated && !!accessToken,
  })
}

export function useCreateGuild() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('post', '/guilds')

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [{ _id: '/users/@me/guilds' }] })
    },
  })
}
