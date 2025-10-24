import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { DMFeature } from '@/pages/dm/features/dm'

export const Route = createFileRoute('/channels/@me')({
  component: DirectMessages,
})

function DirectMessages() {
  return (
    <AuthWrapper>
      <AppLayout>
        <DMFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
