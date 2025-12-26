import { createFileRoute } from '@tanstack/react-router'
import { Compass, Search, TrendingUp, Users, Globe } from 'lucide-react'
import { useServers } from '@/lib/queries/community-queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/explore')({
  component: ExplorePage,
})

function ExplorePage() {
  const { data: servers } = useServers()
  const allServers = servers?.pages.flatMap((page) => page.data) || []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Explore Servers</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Hero Section */}
          <div className="bg-linear-to-r from-primary/10 to-purple-500/10 rounded-lg p-8 border border-sidebar-border">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
                <Globe className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Discover Communities
                </h1>
                <p className="text-muted-foreground text-lg">
                  Find and join public servers. Connect with people who share your interests.
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Featured Servers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allServers.slice(0, 6).map((server) => (
                <Link key={server.id} to="/channels/$serverId/$channelId" params={{ serverId: String(server.id), channelId: '101' }}>
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-3 mb-3">
                      <Avatar className="h-12 w-12 rounded-lg shrink-0">
                        <AvatarImage src={server.picture_url ?? undefined} alt={server.name} />
                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                          {server.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {server.name}
                        </h3>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{server.member_count || 0} members</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {server.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={server.visibility === 'Public' ? 'default' : 'secondary'}>
                        {server.visibility}
                      </Badge>
                      <Button size="sm" className="ml-auto">
                        Join
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* All Servers */}
          {allServers.length > 6 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">All Servers</h2>
              </div>
              <div className="space-y-3">
                {allServers.slice(6).map((server) => (
                  <Link key={server.id} to="/channels/$serverId/$channelId" params={{ serverId: String(server.id), channelId: '101' }}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 rounded-lg shrink-0">
                          <AvatarImage src={server.picture_url ?? undefined} alt={server.name} />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xl">
                            {server.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-foreground text-lg">
                              {server.name}
                            </h3>
                            <Badge variant={server.visibility === 'Public' ? 'default' : 'secondary'}>
                              {server.visibility}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {server.description}
                          </p>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{server.member_count || 0} members online</span>
                          </div>
                        </div>
                        <Button>Join Server</Button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {allServers.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Compass className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  No Servers Found
                </h2>
                <p className="text-muted-foreground">
                  There are no public servers to explore at the moment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
