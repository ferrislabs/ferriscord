import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { ServerDiscoveryFeature } from '@/pages/discovery/features/server-discovery'

export const Route = createFileRoute('/discovery/servers')({
  component: ServerDiscovery,
})

function ServerDiscovery() {
  return (
    <AuthWrapper>
      <AppLayout>
        <ServerDiscoveryFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
