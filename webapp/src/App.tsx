import { useCallback, useEffect, useState } from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { Spinner } from './components/ui/spinner'

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [appIsSetup, setAppIsSetup] = useState(false)

  const setupApp = useCallback(async () => {
    const viteIssuerUrl = import.meta.env.VITE_OIDC_ISSUER_URL
    const viteClientId = import.meta.env.VITE_OIDC_CLIENT_ID

    let issuerUrl: string | undefined
    let clientId: string | undefined

    if (viteIssuerUrl && viteClientId) {
      issuerUrl = viteIssuerUrl
      clientId = viteClientId
    } else {
      const data = await fetch('/config.json')
      const result = await data.json()
      issuerUrl = result.oidc_issuer_url
      clientId = result.oidc_client_id
    }

    if (issuerUrl && clientId) {
      window.issuerUrl = issuerUrl
      window.oidcConfiguration = {
        client_id: clientId,
        redirect_uri: window.location.origin + '/authentication/callback',
        scope: 'openid profile email',
        authority: issuerUrl
      }

      setAppIsSetup(true)
    }
  }, [])

  useEffect(() => {
    setupApp()
  }, [setupApp])

  if (!appIsSetup) {
    return (
      <div className='h-screen flex items-center justify-center text-gray-500'>
        <Spinner />
      </div>
    )
  }

  return <RouterProvider router={router} />;
}
