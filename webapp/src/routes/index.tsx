import { createFileRoute } from '@tanstack/react-router'
import { DashboardFeature } from '@/pages/dashboard/features/dashboard'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <AuthWrapper>
      <AppLayout>
        <DashboardFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
