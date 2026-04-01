import type { QueryClient } from '@tanstack/react-query'
import type { Schemas } from '@/api/api.client'
import { useAuthStore } from '@/stores/auth.store'
import { useCryptoStore } from '@/stores/crypto.store'
import { cryptoApi } from './api'
import {
  decryptDmMessage,
  encryptHistorySyncMessageForDevice,
  isEncryptedMessage,
} from './message-crypto'
import { keyStore } from './key-store'

const HISTORY_SYNC_BATCH_SIZE = 100
const HISTORY_SYNC_REFRESH_MS = 5000
const HISTORY_SYNC_REFRESH_WINDOW_MS = 120000
const HISTORY_SYNC_MARKER_PREFIX = 'ferriscord:e2ee:incoming-history-sync-until:'

let activeSyncPromise: Promise<void> | null = null

function incomingHistorySyncKey(userId: string): string {
  return `${HISTORY_SYNC_MARKER_PREFIX}${userId}`
}

async function dmFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
      // ignore invalid JSON bodies
    }
    throw new Error(errorMessage)
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

async function getCachedPlaintext(
  userId: string,
  messageId: string,
  ciphertext: string,
): Promise<string | undefined> {
  const byId = await keyStore.getSentMessage(userId, messageId)
  if (byId) {
    return byId.plaintext
  }

  const byCiphertext = await keyStore.getSentMessageByCiphertext(userId, ciphertext)
  if (byCiphertext) {
    await keyStore.saveSentMessage(userId, messageId, byCiphertext.plaintext)
    return byCiphertext.plaintext
  }

  return undefined
}

async function cachePlaintext(
  userId: string,
  messageId: string,
  ciphertext: string,
  plaintext: string,
): Promise<void> {
  await keyStore.saveSentMessage(userId, messageId, plaintext)
  await keyStore.saveSentMessageByCiphertext(userId, ciphertext, plaintext)
}

async function resolveHistoryMessagePlaintext(
  userId: string,
  message: Schemas.Message,
): Promise<string | undefined> {
  const cached = await getCachedPlaintext(userId, message.id, message.content)
  if (cached !== undefined) {
    return cached
  }

  if (!isEncryptedMessage(message)) {
    return message.content
  }

  try {
    const plaintext = await decryptDmMessage(
      message.channel_id,
      message.author.id,
      message.sender_device_id,
      message.content,
    )
    await cachePlaintext(userId, message.id, message.content, plaintext)
    return plaintext
  } catch {
    return undefined
  }
}

async function syncHistoryForTargetDevice(
  userId: string,
  sourceDeviceId: string,
  targetDeviceId: string,
): Promise<void> {
  const job = await dmFetch<Schemas.DmHistorySyncJobInfo>('/dm/history-sync/jobs', {
    method: 'POST',
    body: JSON.stringify({
      source_device_id: sourceDeviceId,
      target_device_id: targetDeviceId,
      channel_id: null,
    } satisfies Schemas.CreateDmHistorySyncJobRequest),
  })

  let before: string | undefined

  try {
    while (true) {
      const params = new URLSearchParams()
      params.set('limit', String(HISTORY_SYNC_BATCH_SIZE))
      if (before) {
        params.set('before', before)
      }

      const messages = await dmFetch<Schemas.Message[]>(
        `/dm/history-sync/jobs/${job.id}/messages?${params.toString()}`,
      )

      if (messages.length === 0) {
        break
      }

      const payloads: Schemas.DmHistorySyncPayloadUpload[] = []

      for (const message of messages) {
        const plaintext = await resolveHistoryMessagePlaintext(userId, message)
        if (!plaintext) {
          continue
        }

        const ciphertext = await encryptHistorySyncMessageForDevice(
          message.channel_id,
          targetDeviceId,
          plaintext,
        )

        payloads.push({
          message_id: message.id,
          ciphertext,
        })
      }

      if (payloads.length > 0) {
        await dmFetch<Schemas.UploadDmHistorySyncPayloadsResponse>(
          `/dm/history-sync/jobs/${job.id}/payloads`,
          {
            method: 'POST',
            body: JSON.stringify({
              payloads,
            } satisfies Schemas.UploadDmHistorySyncPayloadsRequest),
          },
        )
      }

      before = messages[0]?.id
      if (messages.length < HISTORY_SYNC_BATCH_SIZE) {
        break
      }
    }

    await dmFetch<Schemas.DmHistorySyncJobInfo>(
      `/dm/history-sync/jobs/${job.id}/complete`,
      { method: 'PUT' },
    )
  } catch (error) {
    await dmFetch<Schemas.DmHistorySyncJobInfo>(
      `/dm/history-sync/jobs/${job.id}/fail`,
      {
        method: 'PUT',
        body: JSON.stringify({
          error_message:
            error instanceof Error ? error.message : 'Unknown history sync error',
        } satisfies Schemas.FailDmHistorySyncJobRequest),
      },
    ).catch(() => {})

    throw error
  }
}

export function markIncomingHistorySyncWindow(userId: string): void {
  localStorage.setItem(
    incomingHistorySyncKey(userId),
    String(Date.now() + HISTORY_SYNC_REFRESH_WINDOW_MS),
  )
}

function getIncomingHistorySyncDeadline(userId: string): number | null {
  const value = localStorage.getItem(incomingHistorySyncKey(userId))
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clearIncomingHistorySyncWindow(userId: string): void {
  localStorage.removeItem(incomingHistorySyncKey(userId))
}

export function startIncomingHistoryRefresh(
  queryClient: QueryClient,
  userId: string,
): () => void {
  const tick = () => {
    const deadline = getIncomingHistorySyncDeadline(userId)
    if (!deadline || deadline <= Date.now()) {
      clearIncomingHistorySyncWindow(userId)
      return false
    }

    void queryClient.invalidateQueries({
      queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
    })
    return true
  }

  if (!tick()) {
    return () => {}
  }

  const interval = window.setInterval(() => {
    if (!tick()) {
      window.clearInterval(interval)
    }
  }, HISTORY_SYNC_REFRESH_MS)

  return () => window.clearInterval(interval)
}

export async function syncDmHistoryToOtherDevices(): Promise<void> {
  if (activeSyncPromise) {
    return activeSyncPromise
  }

  activeSyncPromise = (async () => {
    const { setupStatus, userId, deviceId } = useCryptoStore.getState()
    if (setupStatus !== 'setup' || !userId || !deviceId) {
      return
    }

    const devices = await cryptoApi.listDevices()
    const targetDevices = devices.filter((device) => device.id !== deviceId)

    for (const targetDevice of targetDevices) {
      await syncHistoryForTargetDevice(userId, deviceId, targetDevice.id)
    }
  })()

  try {
    await activeSyncPromise
  } finally {
    activeSyncPromise = null
  }
}
