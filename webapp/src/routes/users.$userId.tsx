import { createFileRoute } from '@tanstack/react-router'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { mockApi } from '@/lib/mock-data'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, getStatusColor, formatDate } from '@/lib/utils'
import { AppLayout } from '@/layouts/app-layout'

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    // Load user data
    const user = await mockApi.getUser(params.userId)

    if (!user) {
      throw new Error('User not found')
    }

    return { user }
  },
  component: UserProfile,
})

function UserProfile() {
  const { user: profileUser } = Route.useLoaderData()
  const { user: currentUser } = useAuth()
  const isCurrentUser = profileUser.id === currentUser?.id

  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full bg-gray-50 overflow-auto">
          <div className="max-w-4xl mx-auto py-8 px-6">
            {/* User Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileUser.avatar} alt={profileUser.username} />
                      <AvatarFallback className="bg-indigo-600 text-white text-2xl">
                        {profileUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white",
                      getStatusColor(profileUser.status)
                    )} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                          {profileUser.username}
                          {profileUser.isBot && (
                            <Badge variant="secondary" className="ml-2">
                              BOT
                            </Badge>
                          )}
                        </h1>
                        <p className="text-gray-600 mb-2">{profileUser.email}</p>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            getStatusColor(profileUser.status)
                          )} />
                          <span className="text-sm text-gray-500 capitalize">
                            {profileUser.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {!isCurrentUser && (
                          <>
                            <Button>
                              📤 Message
                            </Button>
                            <Button variant="outline">
                              👤 Add Friend
                            </Button>
                          </>
                        )}
                        {isCurrentUser && (
                          <Button variant="outline">
                            ⚙️ Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                    <CardDescription>User information and details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <p className="text-sm text-gray-900">{profileUser.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">{profileUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            getStatusColor(profileUser.status)
                          )} />
                          <span className="text-sm text-gray-900 capitalize">
                            {profileUser.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Joined
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(new Date(profileUser.joinedAt))}
                        </p>
                      </div>
                    </div>

                    {profileUser.isBot && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 font-medium">🤖 Bot Account</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          This is an automated bot account that helps with server management and moderation.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions and messages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            Sent a message in <span className="font-medium">#general</span>
                          </p>
                          <p className="text-xs text-gray-500">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            Joined <span className="font-medium">Rust Community</span>
                          </p>
                          <p className="text-xs text-gray-500">1 day ago</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            Changed status to <span className="font-medium capitalize">{profileUser.status}</span>
                          </p>
                          <p className="text-xs text-gray-500">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Mutual Servers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Mutual Servers</CardTitle>
                    <CardDescription>Servers you both belong to</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                          🦀
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rust Community
                          </p>
                          <p className="text-xs text-gray-500">1,247 members</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                          🎮
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Gaming Hub
                          </p>
                          <p className="text-xs text-gray-500">892 members</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                {!isCurrentUser && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full" variant="outline">
                        📤 Send Message
                      </Button>
                      <Button className="w-full" variant="outline">
                        👤 Add Friend
                      </Button>
                      <Button className="w-full" variant="outline">
                        🚫 Block User
                      </Button>
                      <Button className="w-full" variant="outline">
                        ⚠️ Report User
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthWrapper>
  )
}
