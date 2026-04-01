import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/stores/user.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCryptoStore } from '@/stores/crypto.store'
import { useGetMe } from '@/lib/queries/user-queries'
import {
  checkCryptoSetup,
  performFirstTimeSetup,
  restoreFromBackup,
} from '@/lib/crypto/device-manager'

function autoSetupPasswordKey(userId: string): string {
  return `ferriscord_e2ee_auto_password_${userId}`
}

/**
 * CryptoSync: initializes E2EE after authentication.
 *
 * Flow:
 *   1. Waits for the user to be authenticated and /users/@me to resolve
 *   2. Calls checkCryptoSetup(userId) to probe local IndexedDB + server backup
 *   3. If no keys exist (first-time), auto-generates keys with a random security password
 *   4. Sets crypto store to 'setup' so encryption activates
 */
export function CryptoSync() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: me } = useGetMe()
  const queryClient = useQueryClient()
  const initRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !me?.id) return
    if (initRef.current) return
    initRef.current = true

    const userId = me.id

    void (async () => {
      try {
        console.info('[E2EE] Checking crypto setup for user', userId)
        await checkCryptoSetup(userId)

        const status = useCryptoStore.getState().setupStatus
        console.info('[E2EE] Setup status:', status)

        if (status === 'not_setup') {
          console.info('[E2EE] Performing first-time key generation...')
          const tempPassword = crypto.getRandomValues(new Uint8Array(32))
          const passwordStr = Array.from(tempPassword, (b) =>
            b.toString(16).padStart(2, '0'),
          ).join('')
          localStorage.setItem(autoSetupPasswordKey(userId), passwordStr)

          await performFirstTimeSetup(userId, passwordStr)
          console.info('[E2EE] First-time setup completed — encryption active')
          // Re-fetch messages so the decrypting queryFn is used
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
          })
        } else if (status === 'locked') {
          const savedPassword = localStorage.getItem(autoSetupPasswordKey(userId))
          if (savedPassword) {
            console.info('[E2EE] Keys locked — attempting automatic restore')
            await restoreFromBackup(userId, savedPassword)
            console.info('[E2EE] Automatic restore completed — encryption active')
            queryClient.invalidateQueries({
              queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
            })
          } else {
            console.info('[E2EE] Keys locked — security password needed to restore')
          }
        } else if (status === 'setup') {
          console.info('[E2EE] Keys loaded from local storage — encryption active')
          // Re-fetch messages so the decrypting queryFn is used
          queryClient.invalidateQueries({
            queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
          })
        }
      } catch (err) {
        console.error('[E2EE] Initialization failed:', err)
        // Allow retry on next render cycle
        initRef.current = false
      }
    })()
  }, [isAuthenticated, accessToken, me?.id, queryClient])

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      initRef.current = false
      const s = useCryptoStore.getState()
      s.setSetupStatus('unknown')
      s.setUserId(null)
      s.setDeviceId(null)
      s.setUnlocked(false)
    }
  }, [isAuthenticated])

  return null
}
