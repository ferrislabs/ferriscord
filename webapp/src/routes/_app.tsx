import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { SetupAppLayout } from '@/components/layout/setup-app'

export const Route = createFileRoute('/_app')({
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  return (
    <SetupAppLayout>
      <AuthWrapper>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </AuthWrapper>
    </SetupAppLayout>
  )
}
