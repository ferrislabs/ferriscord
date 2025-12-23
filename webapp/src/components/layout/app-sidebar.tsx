import { Hash, Volume2, Settings, LogOut, ChevronDown, Users } from "lucide-react"
import { Link, useParams, useNavigate, useMatchRoute } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useChannels, useMembers, useServer } from "@/lib/queries/community-queries"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock DM users
const mockDMUsers = [
  {
    userId: '935833137349541918',
    username: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    status: 'online',
  },
  {
    userId: '835833137349541919',
    username: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    status: 'idle',
  },
  {
    userId: '735833137349541920',
    username: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    status: 'dnd',
  },
  {
    userId: '635833137349541921',
    username: 'Diana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    status: 'offline',
  },
]

export function AppSidebar() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { user, signOut } = useAuth()

  // Check if we're in DM mode
  const isDMRoute = matchRoute({ to: '/channels/@me' }) || matchRoute({ to: '/channels/@me/$userId' })

  // Get server ID and channel ID from params
  const serverId = params.serverId ? Number(params.serverId) : null
  const channelId = params.channelId ? Number(params.channelId) : null
  const currentUserId = params.userId

  // Fetch server, channels, and members data
  const { data: server } = useServer(serverId!)
  const { data: channels = [] } = useChannels(serverId!)
  const { data: members = [] } = useMembers(serverId!)

  const handleLogout = async () => {
    await signOut()
    navigate({ to: "/" })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "idle":
        return "bg-yellow-500"
      case "dnd":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // DM Sidebar
  if (isDMRoute) {
    return (
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 h-8">
            <span className="font-semibold text-foreground">Direct Messages</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 p-2">
              {/* Friends */}
              <Link to="/channels/@me">
                <div
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                    !currentUserId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Users className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Friends</span>
                </div>
              </Link>

              <div className="pt-4 pb-2">
                <div className="px-2 text-xs font-semibold text-muted-foreground uppercase">
                  Direct Messages
                </div>
              </div>

              {/* DM Users List */}
              {mockDMUsers.map((dmUser) => (
                <Link
                  key={dmUser.userId}
                  to="/channels/@me/$userId"
                  params={{ userId: dmUser.userId }}
                >
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors",
                      currentUserId === dmUser.userId
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={dmUser.avatar} alt={dmUser.username} />
                        <AvatarFallback className="text-xs">
                          {dmUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                          getStatusColor(dmUser.status)
                        )}
                      />
                    </div>
                    <span className="text-sm truncate">{dmUser.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                  getStatusColor(user?.status || "offline")
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.username || "Unknown User"}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {user?.status || "offline"}
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    )
  }

  // Server Sidebar
  if (!server) {
    return (
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground text-sm">Select a server</span>
          </div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      {/* Server Header */}
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 h-12 hover:bg-accent">
              <span className="font-semibold text-foreground truncate">{server.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>Server Settings</DropdownMenuItem>
            <DropdownMenuItem>Invite People</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Leave Server</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Channels List */}
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5">
            {/* Text Channels */}
            {channels.filter((ch) => ch.type === "text").length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  Text Channels
                </div>
                {channels
                  .filter((ch) => ch.type === "text")
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      to="/channels/$serverId/$channelId"
                      params={{ serverId: String(serverId), channelId: String(channel.id) }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 px-2 py-1.5 mx-1 rounded cursor-pointer transition-colors",
                          channelId === channel.id
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <Hash className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}

            {/* Voice Channels */}
            {channels.filter((ch) => ch.type === "voice").length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  Voice Channels
                </div>
                {channels
                  .filter((ch) => ch.type === "voice")
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      to="/channels/$serverId/$channelId"
                      params={{ serverId: String(serverId), channelId: String(channel.id) }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 px-2 py-1.5 mx-1 rounded cursor-pointer transition-colors",
                          channelId === channel.id
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <Volume2 className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}

            {/* Members List */}
            {members.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  Members — {members.length}
                </div>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 px-2 py-1.5 mx-1 rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar_url} alt={member.username} />
                        <AvatarFallback className="text-xs">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                          "bg-gray-500"
                        )}
                      />
                    </div>
                    <span className="text-sm truncate">{member.username}</span>
                    {member.role === "owner" && (
                      <span className="ml-auto text-xs text-yellow-500">👑</span>
                    )}
                    {member.role === "admin" && (
                      <span className="ml-auto text-xs text-blue-500">⚡</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* User Panel */}
      <SidebarFooter>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.username?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                getStatusColor(user?.status || "offline")
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {user?.username || "Unknown User"}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {user?.status || "offline"}
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
