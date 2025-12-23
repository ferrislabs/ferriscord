import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'
import { OidcProvider, type OidcConfiguration } from '@axa-fr/react-oidc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster.tsx'


const container = document.getElementById('root') || (document.createElement('div') as HTMLElement)
const root = createRoot(container)

const configuration: OidcConfiguration = {
  client_id: 'front',
  redirect_uri: window.location.origin + '/authentication/callback',
  scope: 'openid profile email',
  authority: 'http://localhost:8888/realms/ferriscord'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

const render = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OidcProvider configuration={configuration}>
        <App />
        <Toaster />
      </OidcProvider>
    </QueryClientProvider>
  </StrictMode>
)

root.render(render)
