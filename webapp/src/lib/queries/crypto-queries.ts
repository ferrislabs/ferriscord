import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { cryptoApi } from '@/lib/crypto/api'

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const cryptoKeys = {
  devices: ['crypto', 'devices'] as const,
  identityKey: (userId: string) => ['crypto', 'identity', userId] as const,
  keyBundle: (userId: string) => ['crypto', 'bundle', userId] as const,
  keyBackup: ['crypto', 'backup'] as const,
  senderKeys: (channelId: string) => ['crypto', 'sender-keys', channelId] as const,
  dmSession: (channelId: string, deviceId: string) =>
    ['crypto', 'dm-session', channelId, deviceId] as const,
}

// ─── Device Queries ──────────────────────────────────────────────────────────

export function useListDevices() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: cryptoKeys.devices,
    queryFn: () => cryptoApi.listDevices(),
    enabled: isAuthenticated && !!accessToken,
  })
}

export function useRegisterDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { deviceName: string; publicKey: string }) =>
      cryptoApi.registerDevice(params.deviceName, params.publicKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cryptoKeys.devices })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deviceId: string) => cryptoApi.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cryptoKeys.devices })
    },
  })
}

// ─── Identity Key Queries ────────────────────────────────────────────────────

export function useGetIdentityKey(userId: string | null) {
  return useQuery({
    queryKey: cryptoKeys.identityKey(userId ?? ''),
    queryFn: () => cryptoApi.getIdentityKey(userId!),
    enabled: !!userId,
  })
}

export function useUploadIdentityKey() {
  return useMutation({
    mutationFn: (publicKey: string) => cryptoApi.uploadIdentityKey(publicKey),
  })
}

// ─── Pre-Key Mutations ───────────────────────────────────────────────────────

export function useUploadSignedPreKey() {
  return useMutation({
    mutationFn: (params: { publicKey: string; signature: string }) =>
      cryptoApi.uploadSignedPreKey(params.publicKey, params.signature),
  })
}

export function useUploadOneTimePreKeys() {
  return useMutation({
    mutationFn: (prekeys: Array<{ public_key: string }>) =>
      cryptoApi.uploadOneTimePreKeys(prekeys),
  })
}

// ─── Key Bundle ──────────────────────────────────────────────────────────────

export function useGetKeyBundle(userId: string | null) {
  return useQuery({
    queryKey: cryptoKeys.keyBundle(userId ?? ''),
    queryFn: () => cryptoApi.getKeyBundle(userId!),
    enabled: !!userId,
    // Don't cache bundles — OTPs are consumed
    staleTime: 0,
    gcTime: 0,
  })
}

// ─── Key Backup ──────────────────────────────────────────────────────────────

export function useGetKeyBackup() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: cryptoKeys.keyBackup,
    queryFn: () => cryptoApi.getKeyBackup(),
    enabled: isAuthenticated && !!accessToken,
    retry: false,
  })
}

export function useUploadKeyBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      encrypted_blob: string
      salt: string
      nonce: string
      recovery_codes: string
    }) => cryptoApi.uploadKeyBackup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cryptoKeys.keyBackup })
    },
  })
}

// ─── Sender Keys ─────────────────────────────────────────────────────────────

export function useGetSenderKeys(channelId: string | null) {
  return useQuery({
    queryKey: cryptoKeys.senderKeys(channelId ?? ''),
    queryFn: () => cryptoApi.getSenderKeys(channelId!),
    enabled: !!channelId,
  })
}

export function useDistributeSenderKeys() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      channelId: string
      generation: number
      distributions: Array<{
        recipient_device_id: string
        encrypted_key: string
        nonce: string
      }>
    }) =>
      cryptoApi.distributeSenderKeys(
        params.channelId,
        params.generation,
        params.distributions,
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: cryptoKeys.senderKeys(vars.channelId),
      })
    },
  })
}

// ─── DM Sessions ─────────────────────────────────────────────────────────────

export function useGetDmSession(channelId: string | null, deviceId: string | null) {
  return useQuery({
    queryKey: cryptoKeys.dmSession(channelId ?? '', deviceId ?? ''),
    queryFn: () => cryptoApi.getDmSession(channelId!, deviceId!),
    enabled: !!channelId && !!deviceId,
    retry: false,
  })
}

export function useCreateDmSession() {
  return useMutation({
    mutationFn: (params: {
      channelId: string
      deviceId: string
      encryptedRatchetState: string
      ephemeralPublicKey: string
    }) =>
      cryptoApi.createDmSession(
        params.channelId,
        params.deviceId,
        params.encryptedRatchetState,
        params.ephemeralPublicKey,
      ),
  })
}

export function useUpdateDmSession() {
  return useMutation({
    mutationFn: (params: {
      channelId: string
      encryptedRatchetState: string
      ephemeralPublicKey: string
    }) =>
      cryptoApi.updateDmSession(
        params.channelId,
        params.encryptedRatchetState,
        params.ephemeralPublicKey,
      ),
  })
}
