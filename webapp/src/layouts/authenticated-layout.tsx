import { useOidc } from '@axa-fr/react-oidc'
import { useEffect, type PropsWithChildren } from 'react'
import { AppLayout } from '@/layouts/app-layout'
import { PageLoader } from '@/components/ui/page-loader'

/**
 * AuthenticatedLayout - Layout wrapper that ensures user is authenticated
 *
 * This layout:
 * 1. Checks if user is authenticated
 * 2. Redirects to login if not authenticated
 * 3. Shows loading state while checking authentication
 * 4. Renders AppLayout with children when authenticated
 *
 * Usage: Wrap this around routes that require authentication
 */
export function AuthenticatedLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, login } = useOidc()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      login('/')
    }
  }, [isAuthenticated, login])

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="h-screen">
        <PageLoader message="Checking authentication..." />
      </div>
    )
  }

  // User is authenticated, render app layout with children
  return <AppLayout>{children}</AppLayout>
}
