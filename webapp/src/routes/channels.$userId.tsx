import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/layouts/app-layout'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/channels/$userId')({
  loader: async ({ params }) => {
    console.log('🔥 DM loader called:', params)

    // Load the target user and DM messages
    const [user, messages] = await Promise.all([
      mockApi.getUser(params.userId),
      mockApi.getDmMessagesByUserId(params.userId),
    ])

    if (!user) {
      throw new Error('User not found')
    }

    console.log('✅ DM data loaded:', {
      user: user.username,
      messagesCount: messages.length
    })

    return { user, messages }
  },
  component: DirectMessageChannel,
})

function DirectMessageChannel() {
  console.log('🎯 DM Channel component rendered!')

  const { user: targetUser } = Route.useLoaderData()
  const { user: currentUser } = useAuth()

  if (!targetUser) {
    return (
      <AuthWrapper>
        <AppLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
              <p className="text-gray-600">The requested user could not be loaded.</p>
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
          channelId={targetUser.id}
          currentUserId={currentUser?.id || 'unknown'}
          channelName={`@${targetUser.username}`}
          isDM={true}
        />
      </AppLayout>
    </AuthWrapper>
  )
}
