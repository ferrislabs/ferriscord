import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCryptoStore } from '@/stores/crypto.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { restoreFromBackup, restoreFromRecoveryCode } from '@/lib/crypto/device-manager'
import { autoSetupPasswordKey } from '@/lib/crypto/auto-setup-password'
import { markIncomingHistorySyncWindow } from '@/lib/crypto/history-sync'
import { toast } from '@/lib/toast'

type RestoreMode = 'password' | 'recovery'

export function E2eeRestoreDialog() {
  const queryClient = useQueryClient()
  const setupStatus = useCryptoStore((s) => s.setupStatus)
  const userId = useCryptoStore((s) => s.userId)
  const isOpen = setupStatus === 'locked' && !!userId

  const [mode, setMode] = useState<RestoreMode>('password')
  const [securityPassword, setSecurityPassword] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newSecurityPassword, setNewSecurityPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function refreshEncryptedData() {
    await queryClient.invalidateQueries({
      queryKey: [{ _id: '/channels/@me/{channel_id}/messages' }],
    })
  }

  async function handleRestoreWithPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId || !securityPassword.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await restoreFromBackup(userId, securityPassword.trim())
      localStorage.setItem(autoSetupPasswordKey(userId), securityPassword.trim())
      markIncomingHistorySyncWindow(userId)
      await refreshEncryptedData()
      toast.success('E2EE keys restored on this browser')
      setSecurityPassword('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to restore E2EE keys'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRestoreWithRecoveryCode(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault()
    if (
      !userId ||
      !recoveryCode.trim() ||
      !newSecurityPassword.trim() ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    try {
      await restoreFromRecoveryCode(
        userId,
        recoveryCode.trim(),
        newSecurityPassword.trim(),
      )
      localStorage.setItem(
        autoSetupPasswordKey(userId),
        newSecurityPassword.trim(),
      )
      markIncomingHistorySyncWindow(userId)
      await refreshEncryptedData()
      toast.success('E2EE keys restored with recovery code')
      setRecoveryCode('')
      setNewSecurityPassword('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to restore E2EE keys'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className='max-w-lg'
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Restore End-to-End Encryption</DialogTitle>
          <DialogDescription>
            This browser does not have your private DM keys yet. Restore them to
            read encrypted messages and send new encrypted DMs.
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2'>
          <Button
            type='button'
            variant={mode === 'password' ? 'default' : 'outline'}
            onClick={() => setMode('password')}
            disabled={isSubmitting}
            className='flex-1'
          >
            Security Password
          </Button>
          <Button
            type='button'
            variant={mode === 'recovery' ? 'default' : 'outline'}
            onClick={() => setMode('recovery')}
            disabled={isSubmitting}
            className='flex-1'
          >
            Recovery Code
          </Button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handleRestoreWithPassword} className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='e2ee-security-password'
                className='text-sm font-medium text-foreground'
              >
                Security password
              </label>
              <Input
                id='e2ee-security-password'
                type='password'
                placeholder='Enter the password used for your key backup'
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className='rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground'>
              Use this option if you already know the password that was used to
              create your E2EE key backup.
            </div>

            <Button
              type='submit'
              disabled={isSubmitting || !securityPassword.trim()}
              className='w-full'
            >
              {isSubmitting ? 'Restoring…' : 'Restore Keys'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRestoreWithRecoveryCode} className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='e2ee-recovery-code'
                className='text-sm font-medium text-foreground'
              >
                Recovery code
              </label>
              <Input
                id='e2ee-recovery-code'
                placeholder='Enter one of your recovery codes'
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='e2ee-new-security-password'
                className='text-sm font-medium text-foreground'
              >
                New security password
              </label>
              <Input
                id='e2ee-new-security-password'
                type='password'
                placeholder='Choose a new password for future restores'
                value={newSecurityPassword}
                onChange={(e) => setNewSecurityPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className='rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground'>
              Use this option if you no longer know the original security
              password but still have a recovery code.
            </div>

            <Button
              type='submit'
              disabled={
                isSubmitting ||
                !recoveryCode.trim() ||
                !newSecurityPassword.trim()
              }
              className='w-full'
            >
              {isSubmitting ? 'Restoring…' : 'Restore With Recovery Code'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
