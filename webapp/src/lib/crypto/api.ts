/**
 * Manual fetch helpers for the crypto/E2EE API endpoints.
 * These endpoints are not in the auto-generated OpenAPI client.
 */

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

export interface DeviceInfo {
  id: string
  device_name: string
  public_key: string // base64
  created_at: string
  last_seen_at: string
}

export interface IdentityKeyInfo {
  user_id: string
  public_key: string // base64
  created_at: string
}

export interface KeyBundle {
  user_id: string
  identity_key: string // base64
  signed_prekey: string // base64
  signed_prekey_signature: string // base64
  onetime_prekey: string | null // base64
  onetime_prekey_id: string | null
}

export interface KeyBackup {
  encrypted_blob: string // base64
  salt: string // base64
  nonce: string // base64
  recovery_codes: string // base64
  version: number
}

export interface SenderKeyDistribution {
  sender_key_id: string
  sender_user_id: string
  channel_id: string
  generation: number
  encrypted_key: string // base64
  nonce: string // base64
}

export interface DmSessionInfo {
  id: string
  channel_id: string
  device_id: string
  encrypted_ratchet_state: string // base64
  ephemeral_public_key: string // base64
  generation: number
}

export interface SignedPreKeyResponse {
  id: string
}

export interface OneTimePreKeysResponse {
  uploaded: number
  available: number
  ids: string[]
}

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
  uploadSignedPreKey: (publicKey: string, signature: string) =>
    cryptoFetch<SignedPreKeyResponse>('/keys/signed-prekey', {
      method: 'POST',
      body: JSON.stringify({ public_key: publicKey, signature }),
    }),

  uploadOneTimePreKeys: (prekeys: Array<{ public_key: string }>) =>
    cryptoFetch<OneTimePreKeysResponse>('/keys/onetime-prekeys', {
      method: 'POST',
      body: JSON.stringify({ prekeys }),
    }),

  // Key bundle
  getKeyBundle: (userId: string) =>
    cryptoFetch<KeyBundle>(`/keys/bundle/${userId}`),

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
    generation: number,
    distributions: Array<{
      recipient_device_id: string
      encrypted_key: string
      nonce: string
    }>,
  ) =>
    cryptoFetch<void>(`/channels/${channelId}/sender-keys`, {
      method: 'POST',
      body: JSON.stringify({ generation, distributions }),
    }),

  getSenderKeys: (channelId: string) =>
    cryptoFetch<SenderKeyDistribution[]>(`/channels/${channelId}/sender-keys/@me`),

  // DM sessions
  createDmSession: (
    channelId: string,
    deviceId: string,
    encryptedRatchetState: string,
    ephemeralPublicKey: string,
  ) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session`, {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        encrypted_ratchet_state: encryptedRatchetState,
        ephemeral_public_key: ephemeralPublicKey,
      }),
    }),

  getDmSession: (channelId: string, deviceId: string) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session/${deviceId}`),

  updateDmSession: (
    channelId: string,
    encryptedRatchetState: string,
    ephemeralPublicKey: string,
  ) =>
    cryptoFetch<DmSessionInfo>(`/dm/${channelId}/session`, {
      method: 'PUT',
      body: JSON.stringify({
        encrypted_ratchet_state: encryptedRatchetState,
        ephemeral_public_key: ephemeralPublicKey,
      }),
    }),
}
