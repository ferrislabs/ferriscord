import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster.tsx'


const container = document.getElementById('root') || (document.createElement('div') as HTMLElement)
const root = createRoot(container)

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

      <App />
      <Toaster />

    </QueryClientProvider>
  </StrictMode>
)

root.render(render)
