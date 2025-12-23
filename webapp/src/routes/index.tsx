import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { useServers } from '@/lib/queries/community-queries'
import { MessageSquare, Compass, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data: servers } = useServers()
  const allServers = servers?.pages.flatMap((page) => page.data) || []

  return (
    <AuthWrapper>
      <div className="flex h-screen w-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-4xl w-full space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold text-foreground">
                Welcome to Ferriscord
              </h1>
              <p className="text-xl text-muted-foreground">
                Connect with communities and start conversations
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <Link to="/channels/@me">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Direct Messages
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Start private conversations with your friends
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Card>
              </Link>

              <Link to="/explore">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Compass className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Explore Servers
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Discover and join public communities
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Card>
              </Link>
            </div>

            {/* Recent Servers */}
            {allServers.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Your Servers
                  </h2>
                  <Link to="/explore">
                    <Button variant="ghost" className="text-primary">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allServers.slice(0, 4).map((server) => (
                    <Link key={server.id} to="/channels/$serverId/$channelId" params={{ serverId: String(server.id), channelId: '101' }}>
                      <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <Avatar className="h-16 w-16 rounded-lg group-hover:scale-105 transition-transform">
                            <AvatarImage src={server.picture_url ?? undefined} alt={server.name} />
                            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xl">
                              {server.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="w-full">
                            <h3 className="font-semibold text-foreground truncate">
                              {server.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {server.member_count || 0} members
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {allServers.length === 0 && (
              <div className="mt-12 text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Servers Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create or join a server to get started
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Link to="/explore">
                    <Button>
                      <Compass className="h-4 w-4 mr-2" />
                      Explore Servers
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}
