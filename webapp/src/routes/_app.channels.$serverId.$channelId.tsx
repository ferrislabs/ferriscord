import { createFileRoute } from '@tanstack/react-router'
import { useServer, useChannels } from '@/lib/queries/community-queries'
import { Hash, Volume2, Users, Pin, Bell, Search, AtSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageListSkeleton } from '@/components/layout/message-list-skeleton'

export const Route = createFileRoute('/_app/channels/$serverId/$channelId')({
  component: ChannelPage,
})

function ChannelPage() {
  const { serverId, channelId } = Route.useParams()
  const { data: server, isLoading: isLoadingServer } = useServer(Number(serverId))
  const { data: channels = [], isLoading: isLoadingChannels } = useChannels(Number(serverId))

  const selectedChannel = channels.find(ch => ch.id === Number(channelId))
  const isLoading = isLoadingServer || isLoadingChannels

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      {isLoading ? (
        <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
            <span className="text-muted-foreground">|</span>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ) : selectedChannel && (
        <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2">
            {selectedChannel.type === 'voice' ? (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Hash className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="font-semibold text-foreground">{selectedChannel.name}</h2>
            {selectedChannel.description && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">{selectedChannel.description}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
              <Pin className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
              <Users className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Channel Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <MessageListSkeleton />
        ) : selectedChannel ? (
          <div className="p-4 space-y-4">
            {/* Welcome Message */}
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-sidebar-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {selectedChannel.type === 'voice' ? (
                  <Volume2 className="h-8 w-8 text-primary" />
                ) : (
                  <Hash className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to #{selectedChannel.name}!
                </h3>
                <p className="text-muted-foreground">
                  This is the beginning of the #{selectedChannel.name} channel.
                  {selectedChannel.description && (
                    <> {selectedChannel.description}</>
                  )}
                </p>
              </div>
            </div>

            {/* Sample Messages */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 hover:bg-accent/50 p-2 rounded group">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                  S
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-foreground">System</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground mt-1">
                    Welcome to {server?.name}! This is a demo message in the {selectedChannel.name} channel.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 hover:bg-accent/50 p-2 rounded group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold shrink-0">
                  U
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-foreground">User</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground mt-1">
                    Hello everyone! 👋
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Hash className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Channel Selected</h2>
              <p className="text-muted-foreground">
                Select a channel from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      {isLoading ? (
        <div className="p-4 border-t border-sidebar-border">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : selectedChannel && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-2 bg-accent/50 rounded-lg px-4 py-3">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <AtSign className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder={`Message #${selectedChannel.name}`}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}
    </div>
  )
}
