/**
 * Manual fetch helpers for the crypto/E2EE API endpoints.
 * These endpoints are not in the auto-generated OpenAPI client.
 */

import type { Schemas } from '@/api/api.client'
import { useAuthStore } from '@/stores/auth.store'

async function cryptoFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${window.apiUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorBody = await response.json()
      if (errorBody.message) errorMessage = errorBody.message
    } catch {
      // use default message
    }
    throw new Error(errorMessage)
  }

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text)
}

// ─── Types (matching backend entities) ───────────────────────────────────────

export type DeviceInfo = Schemas.DeviceInfo
export type IdentityKeyInfo = Schemas.IdentityKeyInfo
export type KeyBundle = Schemas.KeyBundle
export type KeyBackup = Schemas.KeyBackup
export type SenderKeyDistribution = Schemas.SenderKeyDistribution
export type DmSessionInfo = Schemas.DmSessionInfo
export type SignedPreKeyResponse = Schemas.SignedPreKeyResponse
export type OneTimePreKeysResponse = Schemas.OneTimePreKeysResponse

// ─── API Functions ───────────────────────────────────────────────────────────

export const cryptoApi = {
  // Identity keys
  uploadIdentityKey: (publicKey: string) =>
    cryptoFetch<void>('/keys/identity', {
      method: 'POST',
      body: JSON.stringify({ public_key: publicKey }),
    }),

  getIdentityKey: (userId: string) =>
    cryptoFetch<IdentityKeyInfo>(`/keys/identity/${userId}`),

  // Devices
  registerDevice: (deviceName: string, publicKey: string) =>
    cryptoFetch<DeviceInfo>('/keys/devices', {
      method: 'POST',
      body: JSON.stringify({ device_name: deviceName, public_key: publicKey }),
    }),

  listDevices: () =>
    cryptoFetch<DeviceInfo[]>('/keys/devices'),

  deleteDevice: (deviceId: string) =>
    cryptoFetch<void>(`/keys/devices/${deviceId}`, { method: 'DELETE' }),

  // Pre-keys
  uploadSignedPreKey: (deviceId: string, publicKey: string, signature: string) =>
    cryptoFetch<SignedPreKeyResponse>('/keys/signed-prekey', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, public_key: publicKey, signature }),
    }),

  uploadOneTimePreKeys: (deviceId: string, prekeys: Array<{ public_key: string }>) =>
    cryptoFetch<OneTimePreKeysResponse>('/keys/onetime-prekeys', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, prekeys }),
    }),

  // Key bundle
  getKeyBundle: (userId: string) =>
    cryptoFetch<KeyBundle[]>(`/keys/bundle/${userId}`),

  // Backup
  uploadKeyBackup: (data: {
    encrypted_blob: string
    salt: string
    nonce: string
    recovery_codes: string
  }) =>
    cryptoFetch<void>('/keys/backup', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getKeyBackup: () =>
    cryptoFetch<KeyBackup>('/keys/backup'),

  // Sender keys
  distributeSenderKeys: (
    channelId: string,
    senderDeviceId: string,
    generation: number,
    distributions: Array<{
      recipient_device_id: string
      encrypted_key: string
      nonce: string
    }>,
  ) =>
    cryptoFetch<void>(`/channels/${channelId}/sender-keys`, {
      method: 'POST',
      body: JSON.stringify({
        sender_device_id: senderDeviceId,
        generation,
        distributions,
      }),
    }),

  getSenderKeys: (channelId: string) =>
    cryptoFetch<SenderKeyDistribution[]>(`/channels/${channelId}/sender-keys/@me`),

  // DM sessions
  createDmSession: (
    channelId: string,
    ownerDeviceId: string,
    peerDeviceId: string,
    peerUserId: string,
    encryptedRatchetState: string,
    ephemeralPublicKey: string,
  ) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session`, {
      method: 'POST',
      body: JSON.stringify({
        owner_device_id: ownerDeviceId,
        peer_device_id: peerDeviceId,
        peer_user_id: peerUserId,
        encrypted_ratchet_state: encryptedRatchetState,
        ephemeral_public_key: ephemeralPublicKey,
      }),
    }),

  getDmSession: (channelId: string, ownerDeviceId: string, peerDeviceId: string) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session/${ownerDeviceId}/${peerDeviceId}`),

  updateDmSession: (
    channelId: string,
    ownerDeviceId: string,
    peerDeviceId: string,
    peerUserId: string,
    encryptedRatchetState: string,
    ephemeralPublicKey: string,
  ) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session`, {
      method: 'PUT',
      body: JSON.stringify({
        owner_device_id: ownerDeviceId,
        peer_device_id: peerDeviceId,
        peer_user_id: peerUserId,
        encrypted_ratchet_state: encryptedRatchetState,
        ephemeral_public_key: ephemeralPublicKey,
      }),
    }),
}
