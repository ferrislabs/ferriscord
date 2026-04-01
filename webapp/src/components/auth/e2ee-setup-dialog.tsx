import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCryptoStore } from '@/stores/crypto.store'
import { keyStore } from '@/lib/crypto/key-store'
import {
  autoSetupPasswordKey,
  e2eeSecretsAcknowledgedKey,
} from '@/lib/crypto/auto-setup-password'
import { toast } from '@/lib/toast'

export function E2eeSetupDialog() {
  const setupStatus = useCryptoStore((s) => s.setupStatus)
  const userId = useCryptoStore((s) => s.userId)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [securityPassword, setSecurityPassword] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadSecrets() {
      if (setupStatus !== 'setup' || !userId) {
        setRecoveryCodes(null)
        setSecurityPassword(null)
        setAcknowledged(false)
        setLoading(false)
        return
      }

      setLoading(true)

      const savedRecoveryCodes = await keyStore.getRecoveryCodes(userId)
      const savedPassword = localStorage.getItem(autoSetupPasswordKey(userId))
      const alreadyAcknowledged =
        localStorage.getItem(e2eeSecretsAcknowledgedKey(userId)) === 'true'

      if (cancelled) return

      setRecoveryCodes(savedRecoveryCodes?.codes ?? null)
      setSecurityPassword(savedPassword)
      setAcknowledged(alreadyAcknowledged)
      setLoading(false)
    }

    void loadSecrets()

    return () => {
      cancelled = true
    }
  }, [setupStatus, userId])

  const isOpen = useMemo(() => {
    if (loading || setupStatus !== 'setup' || !userId) return false
    if (acknowledged) return false
    return Boolean(securityPassword || (recoveryCodes && recoveryCodes.length > 0))
  }, [acknowledged, loading, recoveryCodes, securityPassword, setupStatus, userId])

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  function handleConfirmSaved() {
    if (!userId) return
    localStorage.setItem(e2eeSecretsAcknowledgedKey(userId), 'true')
    setAcknowledged(true)
    toast.success('E2EE recovery details saved for this browser')
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className='max-w-3xl'
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Save Your E2EE Recovery Details</DialogTitle>
          <DialogDescription>
            These secrets are required to restore encrypted DM access on another
            browser or after clearing local storage. If you lose them, old
            encrypted messages may become unreadable.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Security Password</CardTitle>
              <CardDescription>
                This password unlocks your encrypted key backup. Keep it in a
                password manager.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-md border border-border bg-muted/40 p-3 font-mono text-xs break-all text-foreground'>
                {securityPassword ?? 'Not available on this browser'}
              </div>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                disabled={!securityPassword}
                onClick={() =>
                  securityPassword &&
                  void copyText(securityPassword, 'Security password')
                }
              >
                Copy Security Password
              </Button>
              <p className='text-xs text-muted-foreground'>
                This value is browser-local in the current implementation. For
                cross-browser recovery, recovery codes are the safer option.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Recovery Codes</CardTitle>
              <CardDescription>
                Use one of these codes if you no longer know the security
                password.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground'>
                {recoveryCodes && recoveryCodes.length > 0 ? (
                  <div className='grid gap-1'>
                    {recoveryCodes.map((code) => (
                      <div key={code}>{code}</div>
                    ))}
                  </div>
                ) : (
                  'No recovery codes found in local storage'
                )}
              </div>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                disabled={!recoveryCodes || recoveryCodes.length === 0}
                onClick={() =>
                  recoveryCodes &&
                  recoveryCodes.length > 0 &&
                  void copyText(recoveryCodes.join('\n'), 'Recovery codes')
                }
              >
                Copy Recovery Codes
              </Button>
              <p className='text-xs text-muted-foreground'>
                Store these codes outside the browser. They are the main way to
                recover encrypted DM access on a new device.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100'>
          If you continue without saving these details, another browser may not
          be able to decrypt your existing encrypted DM history.
        </div>

        <Button
          type='button'
          className='w-full'
          disabled={!securityPassword && (!recoveryCodes || recoveryCodes.length === 0)}
          onClick={handleConfirmSaved}
        >
          I Saved These Recovery Details
        </Button>
      </DialogContent>
    </Dialog>
  )
}
