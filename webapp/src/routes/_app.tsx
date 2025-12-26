import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'

export const Route = createFileRoute('/_app')({
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
}
