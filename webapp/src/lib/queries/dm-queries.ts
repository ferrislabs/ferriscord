import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { useCryptoStore } from '@/stores/crypto.store'
import type { DmChannel } from '@/lib/local-types'
import { encryptDmMessage, decryptDmMessage, isEncryptedMessage } from '@/lib/crypto/message-crypto'
import { keyStore } from '@/lib/crypto/key-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = window.tanstackApi as any

function useAuthEnabled() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  return isAuthenticated && !!accessToken
}

const DMS_KEY = [{ _id: '/channels/@me' }]

async function fetchDmMessages(
  channelId: string,
  options: { deviceId?: string | null; before?: string; limit?: number } = {},
): Promise<import('@/api/api.client').Schemas.Message[]> {
  const accessToken = useAuthStore.getState().accessToken
  const params = new URLSearchParams()

  if (options.deviceId) {
    params.set('device_id', options.deviceId)
  }
  if (options.before) {
    params.set('before', options.before)
  }
  params.set('limit', String(options.limit ?? 50))

  const response = await fetch(
    `${window.apiUrl}/channels/@me/${channelId}/messages?${params.toString()}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch DM messages: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ─── Sent message plaintext cache ────────────────────────────────────────────
// The Double Ratchet is forward-only: the sender cannot decrypt their own
// messages because the chain key has already advanced. We cache the plaintext
// of sent messages so they can be displayed without decryption.
//
// Two-level cache:
//   1. By message ID (set after mutation returns the created message)
//   2. By channel "pending" slot (set before sending, consumed after)
const sentPlaintextById = new Map<string, string>()
const pendingPlaintext = new Map<
  string,
  { plaintext: string; encryptedContent: string }
>() // channelId → last sent encrypted payload

async function getCachedPlaintext(
  messageId: string,
  encryptedContent?: string,
): Promise<string | undefined> {
  const inMemory = sentPlaintextById.get(messageId)
  if (inMemory !== undefined) {
    return inMemory
  }

  const userId = useCryptoStore.getState().userId
  if (!userId) {
    return undefined
  }

  const persisted = await keyStore.getSentMessage(userId, messageId)
  if (persisted) {
    sentPlaintextById.set(messageId, persisted.plaintext)
    return persisted.plaintext
  }

  if (!encryptedContent) {
    return undefined
  }

  const persistedByCiphertext = await keyStore.getSentMessageByCiphertext(
    userId,
    encryptedContent,
  )
  if (!persistedByCiphertext) {
    return undefined
  }

  sentPlaintextById.set(messageId, persistedByCiphertext.plaintext)
  await keyStore.saveSentMessage(userId, messageId, persistedByCiphertext.plaintext)
  return persistedByCiphertext.plaintext
}

async function cacheSentPlaintext(
  plaintext: string,
  options: { messageId?: string; encryptedContent?: string } = {},
): Promise<void> {
  if (options.messageId) {
    sentPlaintextById.set(options.messageId, plaintext)
  }

  const userId = useCryptoStore.getState().userId
  if (!userId) {
    return
  }

  if (options.messageId) {
    await keyStore.saveSentMessage(userId, options.messageId, plaintext)
  }

  if (options.encryptedContent) {
    await keyStore.saveSentMessageByCiphertext(userId, options.encryptedContent, plaintext)
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useListDms() {
  const enabled = useAuthEnabled()
  return useQuery<DmChannel[]>({
    ...api.get('/channels/@me').queryOptions,
    enabled,
  })
}

export function useDmMessages(channelId: string, currentUserId?: string) {
  const enabled = useAuthEnabled()
  const isE2eeSetup = useCryptoStore((s) => s.setupStatus === 'setup')
  const currentDeviceId = useCryptoStore((s) => s.deviceId)

  const selfUserId = currentUserId ?? useCryptoStore.getState().userId ?? undefined

  return useQuery<import('@/api/api.client').Schemas.Message[]>({
    queryKey: [
      { _id: '/channels/@me/{channel_id}/messages', path: { channel_id: channelId } },
      { device_id: currentDeviceId ?? null, limit: 50 },
    ],
    enabled,
    queryFn: async () => {
      const messages = await fetchDmMessages(channelId, {
        deviceId: currentDeviceId,
        limit: 50,
      })

      const hydratedMessages: import('@/api/api.client').Schemas.Message[] = []

      for (const msg of messages) {
        const payloadSyncKind = (msg as { payload_sync_kind?: string | null }).payload_sync_kind

        if (!isEncryptedMessage(msg)) {
          hydratedMessages.push(msg)
          continue
        }

        const isOwnMessage = !!selfUserId && msg.author.id === selfUserId
        const isOwnCurrentDeviceMessage =
          isOwnMessage && (!msg.sender_device_id || msg.sender_device_id === currentDeviceId)

        const cached = await getCachedPlaintext(msg.id, msg.content)
        if (cached !== undefined) {
          hydratedMessages.push({ ...msg, content: cached })
          continue
        }

        if (isOwnCurrentDeviceMessage) {
          // For the latest sent message, also check the pending in-memory slot
          const pending = pendingPlaintext.get(channelId)
          if (pending !== undefined && pending.encryptedContent === msg.content) {
            // Consume pending and promote to the persistent ID cache
            await cacheSentPlaintext(pending.plaintext, {
              messageId: msg.id,
              encryptedContent: msg.content,
            })
            pendingPlaintext.delete(channelId)
            hydratedMessages.push({ ...msg, content: pending.plaintext })
            continue
          }

          // Same account on another browser/device: try to decrypt before
          // falling back to the sender placeholder.
          if (isE2eeSetup) {
            try {
              const decrypted = await decryptDmMessage(
                channelId,
                msg.author.id,
                msg.sender_device_id,
                msg.content,
                {
                  forceNewSession: payloadSyncKind === 'history_sync',
                  persistSession: payloadSyncKind !== 'history_sync',
                },
              )
              await cacheSentPlaintext(decrypted, {
                messageId: msg.id,
                encryptedContent: msg.content,
              })
              hydratedMessages.push({ ...msg, content: decrypted })
              continue
            } catch {
              // Fall through to sender placeholder if this really is our own
              // local send and no decryptable state exists on this browser.
            }
          }

          hydratedMessages.push({
            ...msg,
            content: '🔒 Encrypted message (sent by you)',
          })
          continue
        }

        if (!isE2eeSetup) {
          hydratedMessages.push({ ...msg, content: '🔒 Encrypted message' })
          continue
        }

        // DM ratchet state is order-dependent: history must be replayed sequentially.
        try {
          const decrypted = await decryptDmMessage(
            channelId,
            msg.author.id,
            msg.sender_device_id,
            msg.content,
            {
              forceNewSession: payloadSyncKind === 'history_sync',
              persistSession: payloadSyncKind !== 'history_sync',
            },
          )
          await cacheSentPlaintext(decrypted, {
            messageId: msg.id,
            encryptedContent: msg.content,
          })
          hydratedMessages.push({ ...msg, content: decrypted })
        } catch (err) {
          console.error('[E2EE] Decryption failed for message', msg.id, err)
          hydratedMessages.push({
            ...msg,
            content: '🔒 Unable to decrypt message',
          })
        }
      }

      return hydratedMessages
    },
  })
}

export function useSendDmMessage(channelId: string, recipientUserId?: string) {
  const queryClient = useQueryClient()
  const { mutationOptions } = api.mutation('post', '/channels/@me/{channel_id}/messages')
  return useMutation({
    mutationFn: async ({
      content,
      files,
      overrideRecipientUserId,
    }: {
      content: string
      files?: File[]
      overrideRecipientUserId?: string
    }) => {
      const formData = new FormData()

      // Encrypt message if E2EE is set up and we know the recipient
      const cryptoState = useCryptoStore.getState()
      const recipient = overrideRecipientUserId ?? recipientUserId
      let wasEncrypted = false
      if (cryptoState.setupStatus === 'setup' && recipient) {
        try {
          const { encryptedContent, encryptionVersion, devicePayloads } =
            await encryptDmMessage(channelId, recipient, content)
          formData.append('content', encryptedContent)
          formData.append('encrypted', 'true')
          formData.append('encryption_version', String(encryptionVersion))
          if (cryptoState.deviceId) {
            formData.append('sender_device_id', cryptoState.deviceId)
          }
          formData.append(
            'device_payloads',
            JSON.stringify(
              devicePayloads.map((payload) => ({
                target_device_id: payload.targetDeviceId,
                ciphertext: payload.encryptedContent,
              })),
            ),
          )
          await cacheSentPlaintext(content, { encryptedContent })
          wasEncrypted = true
        } catch (err) {
          console.error('[E2EE] Encryption failed, sending plaintext:', err)
          formData.append('content', content)
        }
      } else {
        formData.append('content', content)
        if (cryptoState.deviceId) {
          formData.append('sender_device_id', cryptoState.deviceId)
        }
      }

      if (files) {
        files.forEach((f) => formData.append('files', f))
      }

      // Cache plaintext BEFORE sending so it's available when the query re-fetches
      if (wasEncrypted) {
        const encryptedContent = formData.get('content')
        if (typeof encryptedContent === 'string') {
          pendingPlaintext.set(channelId, { plaintext: content, encryptedContent })
        }
      }

      const result = await mutationOptions.mutationFn({
        path: { channel_id: channelId },
        overrides: { body: formData },
      })

      // Promote pending cache to ID-based cache
      if (wasEncrypted) {
        const msgId = result?.id ?? result?.data?.id
        if (msgId) {
          await cacheSentPlaintext(content, { messageId: msgId })
        }
        pendingPlaintext.delete(channelId)
      }

      return result
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
