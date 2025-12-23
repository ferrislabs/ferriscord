import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'

export const Route = createFileRoute('/_app')({
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  return (
    <AuthWrapper>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthWrapper>
  )
}
