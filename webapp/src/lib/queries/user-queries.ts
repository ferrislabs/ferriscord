import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

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
    ...mutationOptions,
    mutationFn: ({
      displayName,
      avatar,
    }: {
      displayName?: string
      avatar?: File
    }) => {
      const formData = new FormData()
      if (displayName !== undefined) formData.append('display_name', displayName)
      if (avatar) formData.append('avatar', avatar)

      return mutationOptions.mutationFn({
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
