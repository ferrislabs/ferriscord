import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthSync } from '@/components/auth/auth-sync'

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <AuthSync />
        <Outlet />
      </>
    )
  },
})
