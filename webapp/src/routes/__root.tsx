import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthSync } from '@/components/auth/auth-sync'
import { CryptoSync } from '@/components/auth/crypto-sync'
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
        <WsSync />
        <Outlet />
      </>
    )
  },
})
