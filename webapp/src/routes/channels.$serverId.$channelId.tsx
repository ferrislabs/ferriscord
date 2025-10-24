import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/channels/$serverId/$channelId')({
  loader: async ({ params }) => {
    console.log('🔥 Channel loader called:', params)

    // Load server, channel, and initial messages
    const [servers, channels, messages] = await Promise.all([
      mockApi.getServers(),
      mockApi.getChannels(params.serverId),
      mockApi.getMessages(params.channelId),
    ])

    const server = servers.find(s => s.id === params.serverId)
    const channel = channels.find(c => c.id === params.channelId)

    if (!server) {
      throw new Error('Server not found')
    }

    if (!channel) {
      throw new Error('Channel not found')
    }

    console.log('✅ Channel data loaded:', {
      server: server.name,
      channel: channel.name,
      messagesCount: messages.length
    })

    return { server, channel, messages }
  },
  component: Channel,
})

function Channel() {
  console.log('🎯 Channel component rendered!')

  const { server, channel } = Route.useLoaderData()
  const { user } = useAuth()

  if (!server) {
    return (
      <AuthWrapper>
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Server not found</h2>
              <p className="text-gray-600">The requested server could not be loaded.</p>
            </div>
          </div>
        </AppLayout>
      </AuthWrapper>
    )
  }

  if (!channel) {
    return (
      <AuthWrapper>
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Channel not found</h2>
              <p className="text-gray-600">The requested channel could not be loaded.</p>
            </div>
          </div>
        </AppLayout>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <AppLayout>
        <ChatRoomFeature
          channelId={channel.id}
          currentUserId={user?.id || 'unknown'}
          channelName={channel.name}
        />
      </AppLayout>
    </AuthWrapper>
  )
}
