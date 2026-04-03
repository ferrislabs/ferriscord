import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthSync } from '@/components/auth/auth-sync'
import { CryptoSync } from '@/components/auth/crypto-sync'
import { E2eeSetupDialog } from '@/components/auth/e2ee-setup-dialog'
import { E2eeRestoreDialog } from '@/components/auth/e2ee-restore-dialog'
import { useWsEvents } from '@/hooks/use-ws-events'

function WsSync() {
  useWsEvents()
  return null
}

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <AuthSync />
        <CryptoSync />
        <E2eeSetupDialog />
        <E2eeRestoreDialog />
        <WsSync />
        <Outlet />
      </>
    )
  },
})
