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

export function useListInvites(guildId: string | null | undefined) {
  return useQuery({
    ...window.tanstackApi.get('/guilds/{guild_id}/invites', { path: { guild_id: guildId! } }).queryOptions,
    enabled: !!guildId,
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('post', '/guilds/{guild_id}/invites')

  return useMutation({
    ...mutationOptions,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [{ _id: '/guilds/{guild_id}/invites', path: { guild_id: (vars as any).path.guild_id } }] })
    },
  })
}

export function useDeleteInvite() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('delete', '/guilds/{guild_id}/invites/{invite_id}')

  return useMutation({
    ...mutationOptions,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [{ _id: '/guilds/{guild_id}/invites', path: { guild_id: (vars as any).path.guild_id } }] })
    },
  })
}

export function useJoinGuild() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('post', '/guilds/join')

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [{ _id: '/users/@me/guilds' }] })
    },
  })
}
