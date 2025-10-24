import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => {
    console.log('🏠 Root Route Rendered - current path:', window.location.pathname)
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools position='bottom-right' />
      </>
    )
  },
})
