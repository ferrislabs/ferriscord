import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useGetUser(userId: string | null) {
  return useQuery({
    ...window.tanstackApi.get('/users/{user_id}', { path: { user_id: userId ?? '' } }).queryOptions,
    enabled: !!userId,
  })
}

export function useGetMe() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    ...window.tanstackApi.get('/users/@me').queryOptions,
    enabled: isAuthenticated && !!accessToken,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('patch', '/users/@me')

  return useMutation({
    mutationFn: ({
      displayName,
      avatar,
      bio,
      banner,
    }: {
      displayName?: string
      avatar?: File
      bio?: string
      banner?: File
    }) => {
      const formData = new FormData()
      if (displayName !== undefined) formData.append('display_name', displayName)
      if (avatar) formData.append('avatar', avatar)
      if (bio !== undefined) formData.append('bio', bio)
      if (banner) formData.append('banner', banner)

      return (mutationOptions.mutationFn as any)({
        overrides: { body: formData },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: window.tanstackApi.get('/users/@me').queryKey,
      })
    },
  })
}
