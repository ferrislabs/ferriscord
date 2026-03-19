import { useEffect, useState } from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { SetupAppLayout } from '@/layouts/setup-app-layout'
import { initializeAppConfig } from '@/lib/config-loader'
import type { TanstackQueryApiClient } from './api/api.tanstack'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

declare global {
  interface Window {
    tanstackApi: TanstackQueryApiClient,
    apiUrl: string,
  }
}

export default function App() {
  const [isConfiguring, setIsConfiguring] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function setupApp() {
      setIsConfiguring(true)

      const { error: configError } = await initializeAppConfig()

      if (configError) {
        setError(configError)
      }

      setIsConfiguring(false)
    }

    setupApp()
  }, [])

  return (
    <SetupAppLayout isConfiguring={isConfiguring} error={error}>
      <RouterProvider router={router} />
    </SetupAppLayout>
  )
}
