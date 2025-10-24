import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'

export const Route = createFileRoute('/servers/$serverId')({
  loader: async ({ params }) => {
    // Load server data and channels
    const [servers, channels] = await Promise.all([
      mockApi.getServers(),
      mockApi.getChannels(params.serverId),
    ])

    const server = servers.find(s => s.id === params.serverId)
    if (!server) {
      throw new Error('Server not found')
    }

    return { server, channels }
  },
  component: ServerDetail,
})

function ServerDetail() {
  const { server, channels } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  // Auto-redirect to first available channel
  useEffect(() => {
    if (channels.length > 0) {
      const firstChannel = channels.find(c => c.type === 'text') || channels[0]
      navigate({
        to: '/servers/$serverId/channels/$channelId',
        params: {
          serverId: server.id,
          channelId: firstChannel.id
        }
      })
    }
  }, [channels, server.id, navigate])

  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
              {server.icon || server.name[0]}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {server.name}
            </h2>
            <p className="text-gray-600 mb-6">
              {server.description || 'Welcome to the server!'}
            </p>
            <div className="text-sm text-gray-500">
              {channels.length > 0
                ? 'Redirecting to first channel...'
                : 'No channels available in this server'
              }
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
