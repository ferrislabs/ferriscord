import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/servers/$serverId/channels/$channelId')({
  loader: async ({ params }) => {
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

    return { server, channel, messages }
  },
  component: Channel,
})

function Channel() {
  const { channel } = Route.useLoaderData()
  const { user } = useAuth()

  return (
    <AuthWrapper>
      <AppLayout>
        <div className="flex flex-col h-full">
          {/* Channel Header */}
          <div className="shrink-0 h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-lg">
                  {channel.type === 'voice' ? '🔊' : '#'}
                </span>
                <h1 className="text-lg font-semibold text-gray-900">
                  {channel.name}
                </h1>
              </div>
              {channel.description && (
                <>
                  <div className="w-px h-6 bg-gray-300" />
                  <p className="text-sm text-gray-600">
                    {channel.description}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <span>👥</span>
                <span>{channel.memberCount || 0} members</span>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            <ChatRoomFeature
              channelId={channel.id}
              currentUserId={user?.id || 'unknown'}
            />
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
