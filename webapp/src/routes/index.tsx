import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useOidc } from '@axa-fr/react-oidc'
import { useUserStore } from '@/stores/user.store'
import { getLastVisited } from '@/lib/last-visited'
import { PageLoader } from '@/components/ui/page-loader'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useOidc()
  const isLoading = useUserStore((s) => s.isLoading)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      login('/')
      return
    }

    const lastVisited = getLastVisited()
    navigate({ to: lastVisited ?? '/channels/@me', replace: true })
  }, [isAuthenticated, isLoading])

  return <PageLoader message='Loading...' />
}
