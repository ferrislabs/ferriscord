import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Hash, Volume2, Users, Pin, Bell, Search, Menu } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageListSkeleton } from '@/components/layout/message-list-skeleton'
import { MessageInput } from '@/components/chat'
import { MessageList } from '@/pages/chat/ui/message-list'
import { saveLastVisited } from '@/lib/last-visited'
import { useGuildChannels } from '@/lib/queries/channel-queries'
import { useChannelMessages, useSendMessage, useDeleteMessage } from '@/lib/queries/message-queries'
import { useGetMe } from '@/lib/queries/user-queries'
import { useWsRoom } from '@/hooks/use-ws-events'
import { MemberList } from '@/components/guild/member-list'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

export const Route = createFileRoute('/_app/channels/$serverId/$channelId')({
  component: ChannelPage,
})

function ChannelPage() {
  const { serverId, channelId } = Route.useParams()
  const { setCollapsed } = useSidebar()
  const [showMemberList, setShowMemberList] = useState(
    () => localStorage.getItem('memberListOpen') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('memberListOpen', String(showMemberList))
  }, [showMemberList])

  useWsRoom(`channel:${channelId}`)
  // Always subscribe to the guild room so presence changes are broadcast
  // to/from this user even when the member list panel is closed.
  useWsRoom(`guild:${serverId}`)

  useEffect(() => {
    saveLastVisited(`/channels/${serverId}/${channelId}`)
  }, [serverId, channelId])

  const { data: channels = [], isLoading: isLoadingChannels } = useGuildChannels(serverId)
  const { data: messages = [], isLoading: isLoadingMessages } = useChannelMessages(serverId, channelId)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(serverId, channelId)
  const { mutate: deleteMessage } = useDeleteMessage(serverId, channelId)
  const { data: me } = useGetMe()

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId)
  }

  const selectedChannel = channels.find((ch) => ch.id === channelId)
  const isLoading = isLoadingChannels

  const handleSendMessage = (content: string, files?: File[]) => {
    sendMessage({ content, files })
  }

  // Map API messages to MessageList format
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    attachments: msg.attachments,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      avatar: msg.author.avatar_url ?? undefined,
    },
    timestamp: msg.created_at,
    isOwn: me?.id === msg.author.id,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      {isLoading ? (
        <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
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
            <button
              className="md:hidden p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setCollapsed(false)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {selectedChannel.kind === 'Voice' ? (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Hash className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="font-semibold text-foreground">{selectedChannel.name}</h2>
            {selectedChannel.topic && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">{selectedChannel.topic}</span>
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
            <button
              onClick={() => setShowMemberList((v) => !v)}
              className={cn(
                "p-2 rounded text-muted-foreground hover:text-foreground transition-colors",
                showMemberList ? "bg-accent text-foreground" : "hover:bg-accent"
              )}
            >
              <Users className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Channel Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {isLoading || isLoadingMessages ? (
            <MessageListSkeleton />
          ) : selectedChannel ? (
            <MessageList messages={formattedMessages} className="flex-1" onDeleteMessage={handleDeleteMessage} />
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

          {/* Message Input */}
          {isLoading ? (
            <div className="p-4 border-t border-sidebar-border">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : selectedChannel && (
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isSending}
              channelName={selectedChannel.name}
              channelType="text"
              className="border-t-0"
            />
          )}
        </div>
        {showMemberList && <MemberList guildId={serverId} className="hidden md:flex" />}
      </div>
    </div>
  )
}
