import { createFileRoute } from '@tanstack/react-router'
import { ServersFeature } from '@/pages/servers/features/servers'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'

export const Route = createFileRoute('/servers')({
  component: Servers,
})

function Servers() {
  return (
    <AuthWrapper>
      <AppLayout>
        <ServersFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
