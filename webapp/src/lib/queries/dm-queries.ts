import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import type { DmChannel } from '@/lib/local-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = window.tanstackApi as any

function useAuthEnabled() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  return isAuthenticated && !!accessToken
}

const DMS_KEY = [{ _id: '/channels/@me' }]

export function useListDms() {
  const enabled = useAuthEnabled()
  return useQuery<DmChannel[]>({
    ...api.get('/channels/@me').queryOptions,
    enabled,
  })
}

export function useDmMessages(channelId: string) {
  const enabled = useAuthEnabled()
  // Message type matches the guild message type shape
  return useQuery<import('@/api/api.client').Schemas.Message[]>({
    ...api.get('/channels/@me/{channel_id}/messages', {
      path: { channel_id: channelId },
      query: { limit: 50 },
    }).queryOptions,
    enabled,
  })
}

export function useSendDmMessage(channelId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('post', '/channels/@me/{channel_id}/messages')
  return useMutation({
    mutationFn: ({
      content,
      files,
    }: {
      content: string
      files?: File[]
    }) => {
      const formData = new FormData()
      formData.append('content', content)
      if (files) {
        files.forEach((f) => formData.append('files', f))
      }
      return mutationOptions.mutationFn({
        path: { channel_id: channelId },
        overrides: { body: formData },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/channels/@me/{channel_id}/messages', path: { channel_id: channelId } }],
      })
    },
  })
}

export function useDeleteDmMessage(channelId: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation(
    'delete',
    '/channels/@me/{channel_id}/messages/{message_id}',
  )
  return useMutation({
    mutationFn: (messageId: string) =>
      mutationOptions.mutationFn({
        path: { channel_id: channelId, message_id: messageId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: '/channels/@me/{channel_id}/messages', path: { channel_id: channelId } }],
      })
    },
  })
}

export function useCreateOrGetDm() {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('post', '/channels/@me')
  return useMutation<DmChannel, Error, { body: { recipient_id: string } }>({
    mutationFn: (vars) => mutationOptions.mutationFn(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DMS_KEY })
    },
  })
}
