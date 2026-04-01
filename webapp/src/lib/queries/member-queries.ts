import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useGuildRoles(guildId: string | null | undefined) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    ...window.tanstackApi.get('/guilds/{guild_id}/roles', {
      path: { guild_id: guildId! },
    }).queryOptions,
    enabled: isAuthenticated && !!accessToken && !!guildId,
  })
}

export function useAssignRole(guildId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'put',
    '/guilds/{guild_id}/members/{user_id}/roles/{role_id}',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/guilds/{guild_id}/members', {
          path: { guild_id: guildId },
        }).queryKey,
      })
    },
  })
}

export function useRemoveRole(guildId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'delete',
    '/guilds/{guild_id}/members/{user_id}/roles/{role_id}',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/guilds/{guild_id}/members', {
          path: { guild_id: guildId },
        }).queryKey,
      })
    },
  })
}

export function useCreateRole(guildId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'post',
    '/guilds/{guild_id}/roles',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/guilds/{guild_id}/roles', {
          path: { guild_id: guildId },
        }).queryKey,
      })
    },
  })
}

export function useDeleteRole(guildId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'delete',
    '/guilds/{guild_id}/roles/{role_id}',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/guilds/{guild_id}/roles', {
          path: { guild_id: guildId },
        }).queryKey,
      })
    },
  })
}

export function useUpdateRole(guildId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roleId,
      body,
    }: {
      roleId: string
      body: { name: string; color: number; permissions: number }
    }) => {
      const accessToken = useAuthStore.getState().accessToken
      const response = await fetch(
        `${window.apiUrl}/guilds/${guildId}/roles/${roleId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        let message = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorBody = await response.json()
          if (errorBody.message) {
            message = errorBody.message
          }
        } catch {
          // Ignore body parse errors and keep the default message.
        }
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/guilds/{guild_id}/roles', {
          path: { guild_id: guildId },
        }).queryKey,
      })
    },
  })
}
