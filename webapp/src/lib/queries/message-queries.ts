import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useSendMessage(guildId: string, channelId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions, queryKey: messagesQueryKey } = {
    ...window.tanstackApi.mutation(
      'post',
      '/guilds/{guild_id}/channels/{channel_id}/messages',
    ),
    queryKey: window.tanstackApi.get(
      '/guilds/{guild_id}/channels/{channel_id}/messages',
      { path: { guild_id: guildId, channel_id: channelId } },
    ).queryKey,
  }

  return useMutation({
    ...mutationOptions,
    mutationFn: ({ content, files }: { content: string; files?: File[] }) => {
      const formData = new FormData()
      formData.append('content', content)
      files?.forEach((file) => formData.append('files', file))

      return mutationOptions.mutationFn({
        path: { guild_id: guildId, channel_id: channelId },
        overrides: { body: formData },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey })
    },
  })
}
