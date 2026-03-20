import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

function useAuthEnabled() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  return isAuthenticated && !!accessToken
}

const FRIENDS_KEY = [{ _id: '/friends' }]
const INCOMING_KEY = [{ _id: '/friends/requests/incoming' }]
const OUTGOING_KEY = [{ _id: '/friends/requests/outgoing' }]

export function useListFriends() {
  const enabled = useAuthEnabled()
  return useQuery({
    ...window.tanstackApi.get('/friends').queryOptions,
    enabled,
  })
}

export function useListIncomingRequests() {
  const enabled = useAuthEnabled()
  return useQuery({
    ...window.tanstackApi.get('/friends/requests/incoming').queryOptions,
    enabled,
  })
}

export function useListOutgoingRequests() {
  const enabled = useAuthEnabled()
  return useQuery({
    ...window.tanstackApi.get('/friends/requests/outgoing').queryOptions,
    enabled,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('post', '/friends/requests')
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTGOING_KEY })
    },
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'patch',
    '/friends/requests/{request_id}/accept',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY })
      queryClient.invalidateQueries({ queryKey: INCOMING_KEY })
    },
  })
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation(
    'patch',
    '/friends/requests/{request_id}/decline',
  )
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOMING_KEY })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()
  const { mutationOptions } = window.tanstackApi.mutation('delete', '/friends/{user_id}')
  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY })
    },
  })
}
