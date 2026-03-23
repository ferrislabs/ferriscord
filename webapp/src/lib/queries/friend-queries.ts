import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import type { Friendship } from '@/lib/local-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = window.tanstackApi as any

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
  return useQuery<Friendship[]>({
    ...api.get('/friends').queryOptions,
    enabled,
  })
}

export function useListIncomingRequests() {
  const enabled = useAuthEnabled()
  return useQuery<Friendship[]>({
    ...api.get('/friends/requests/incoming').queryOptions,
    enabled,
  })
}

export function useListOutgoingRequests() {
  const enabled = useAuthEnabled()
  return useQuery<Friendship[]>({
    ...api.get('/friends/requests/outgoing').queryOptions,
    enabled,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('post', '/friends/requests')
  return useMutation<Friendship, Error, { body: { username: string } }>({
    mutationFn: (vars) => mutationOptions.mutationFn(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTGOING_KEY })
    },
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('patch', '/friends/requests/{request_id}/accept')
  return useMutation<Friendship, Error, { path: { request_id: string } }>({
    mutationFn: (vars) => mutationOptions.mutationFn(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY })
      queryClient.invalidateQueries({ queryKey: INCOMING_KEY })
    },
  })
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('patch', '/friends/requests/{request_id}/decline')
  return useMutation<void, Error, { path: { request_id: string } }>({
    mutationFn: (vars) => mutationOptions.mutationFn(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOMING_KEY })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('delete', '/friends/{user_id}')
  return useMutation<void, Error, { path: { user_id: string } }>({
    mutationFn: (vars) => mutationOptions.mutationFn(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY })
    },
  })
}
