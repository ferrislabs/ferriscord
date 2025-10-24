import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/dm/$dmId')({
  loader: async ({ params }) => {
    // Load direct message conversation and messages
    const [directMessages, messages] = await Promise.all([
      mockApi.getDirectMessages(),
      mockApi.getDmMessages(params.dmId),
    ])

    const dm = directMessages.find(d => d.id === params.dmId)

    if (!dm) {
      throw new Error('Direct message conversation not found')
    }

    // Get the other participant (not the current user) - we'll get current user from auth hook
    const otherParticipant = dm.participants.find(p => p.id !== 'user-1') // Default fallback

    return { dm, messages, otherParticipant }
  },
  component: DirectMessage,
})

function DirectMessage() {
  const { dm, otherParticipant } = Route.useLoaderData()
  const { user } = useAuth()

  // Get the actual other participant based on current user
  const actualOtherParticipant = dm.participants.find(p => p.id !== user?.id) || otherParticipant

  return (
    <AuthWrapper>
      <AppLayout>
        <div className="flex flex-col h-full">
          {/* DM Header */}
          <div className="shrink-0 h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {actualOtherParticipant?.avatar ? (
                    <img
                      src={actualOtherParticipant.avatar}
                      alt={actualOtherParticipant.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    actualOtherParticipant?.username?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${actualOtherParticipant?.status === 'online' ? 'bg-green-500' :
                  actualOtherParticipant?.status === 'away' ? 'bg-yellow-500' :
                    actualOtherParticipant?.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {actualOtherParticipant?.username || 'Unknown User'}
                </h1>
                <p className="text-sm text-gray-500 capitalize">
                  {actualOtherParticipant?.status || 'offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-gray-500">
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                📞
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                📹
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                ⚙️
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            <ChatRoomFeature
              channelId={dm.id}
              currentUserId={user?.id || 'unknown'}
            />
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
