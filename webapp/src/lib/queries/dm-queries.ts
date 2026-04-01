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

// ─── Sent message plaintext cache ────────────────────────────────────────────
// The Double Ratchet is forward-only: the sender cannot decrypt their own
// messages because the chain key has already advanced. We cache the plaintext
// of sent messages so they can be displayed without decryption.
//
// Two-level cache:
//   1. By message ID (set after mutation returns the created message)
//   2. By channel "pending" slot (set before sending, consumed after)
const sentPlaintextById = new Map<string, string>()
const pendingPlaintext = new Map<string, string>() // channelId → plaintext

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

  const baseQuery = api.get('/channels/@me/{channel_id}/messages', {
    path: { channel_id: channelId },
    query: { limit: 50 },
  })
  const selfUserId = currentUserId ?? useCryptoStore.getState().userId ?? undefined

  return useQuery<import('@/api/api.client').Schemas.Message[]>({
    ...baseQuery.queryOptions,
    enabled,
    queryFn: async (ctx: { queryKey: unknown[]; signal: AbortSignal }) => {
      const messages: import('@/api/api.client').Schemas.Message[] =
        await baseQuery.queryOptions.queryFn(ctx)

      return Promise.all(
        messages.map(async (msg: import('@/api/api.client').Schemas.Message) => {
          if (!isEncryptedMessage(msg)) return msg

          const cached = await getCachedPlaintext(msg.id, msg.content)
          if (cached !== undefined) {
            return { ...msg, content: cached }
          }

          if (selfUserId && msg.author.id === selfUserId) {
            // For the latest sent message, also check the pending in-memory slot
            const pending = pendingPlaintext.get(channelId)
            if (pending !== undefined) {
              // Consume pending and promote to the persistent ID cache
              await cacheSentPlaintext(pending, {
                messageId: msg.id,
                encryptedContent: msg.content,
              })
              pendingPlaintext.delete(channelId)
              return { ...msg, content: pending }
            }

            // No cache at all — cannot decrypt own message
            return { ...msg, content: '🔒 Encrypted message (sent by you)' }
          }

          if (!isE2eeSetup) {
            return { ...msg, content: '🔒 Encrypted message' }
          }

          // Decrypt other party's messages
          try {
            const decrypted = await decryptDmMessage(
              channelId,
              msg.author.id,
              msg.content,
            )
            await cacheSentPlaintext(decrypted, {
              messageId: msg.id,
              encryptedContent: msg.content,
            })
            return { ...msg, content: decrypted }
          } catch (err) {
            console.error('[E2EE] Decryption failed for message', msg.id, err)
            return { ...msg, content: '🔒 Unable to decrypt message' }
          }
        }),
      )
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
          const { encryptedContent, encryptionVersion } =
            await encryptDmMessage(channelId, recipient, content)
          formData.append('content', encryptedContent)
          formData.append('encrypted', 'true')
          formData.append('encryption_version', String(encryptionVersion))
          await cacheSentPlaintext(content, { encryptedContent })
          wasEncrypted = true
        } catch (err) {
          console.error('[E2EE] Encryption failed, sending plaintext:', err)
          formData.append('content', content)
        }
      } else {
        formData.append('content', content)
      }

      if (files) {
        files.forEach((f) => formData.append('files', f))
      }

      // Cache plaintext BEFORE sending so it's available when the query re-fetches
      if (wasEncrypted) {
        pendingPlaintext.set(channelId, content)
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
