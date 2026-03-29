import { createFileRoute } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { Phone, Video, Pin, Search, Trash2, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageInput } from '@/components/chat'
import {
  useDmMessages,
  useSendDmMessage,
  useListDms,
  useDeleteDmMessage,
} from '@/lib/queries/dm-queries'
import { useGetMe } from '@/lib/queries/user-queries'
import { useWsRoom } from '@/hooks/use-ws-events'
import { AttachmentList } from '@/components/chat/attachment-list'
import { InviteEmbed, extractInviteCodes } from '@/components/chat/invite-embed'
import { toast } from '@/lib/toast'
import { useSidebar } from '@/components/ui/sidebar'
import { useProfileCardStore } from '@/stores/profile-card.store'
import { FormattedMessage } from '@/components/ui/formatted-message'
import { useNotificationStore } from '@/stores/notification.store'
import { useTypingStore } from '@/stores/typing.store'
import { TypingIndicator } from '@/components/ui/typing-indicator'

const EMPTY_TYPING_USERS: Array<{ userId: string; username: string }> = []

export const Route = createFileRoute('/_app/channels/@me/$channelId')({
  component: DMConversationPage,
})

function DMConversationPage() {
  const { channelId } = Route.useParams()
  const { setCollapsed } = useSidebar()
  const toggleProfile = useProfileCardStore((s) => s.toggle)
  const clearDmUnread = useNotificationStore((s) => s.clearDmUnread)

  useWsRoom(`dm:${channelId}`)

  const { data: dms = [] } = useListDms()
  const { data: messages = [], isLoading } = useDmMessages(channelId)
  const sendMessage = useSendDmMessage(channelId)
  const { mutate: deleteMessage } = useDeleteDmMessage(channelId)
  const { data: me } = useGetMe()
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingUsers = useTypingStore(
    (state) => state.typingByRoom[`dm:${channelId}`] ?? EMPTY_TYPING_USERS,
  )

  const dm = dms.find((d) => d.id === channelId)
  const displayName = dm
    ? (dm.recipient.display_name ?? dm.recipient.username)
    : '...'
  const typingNames = typingUsers.map(() => displayName)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    clearDmUnread(channelId)
  }, [channelId, clearDmUnread])

  const handleSendMessage = (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return
    sendMessage.mutate(
      { content, files },
      {
        onError: () => toast.error('Failed to send message'),
      },
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background shrink-0'>
        <div className='flex items-center space-x-3'>
          <button
            className='md:hidden p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'
            onClick={() => setCollapsed(false)}
          >
            <Menu className='h-5 w-5' />
          </button>
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={dm?.recipient.avatar_url ?? undefined}
              alt={displayName}
            />
            <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className='font-semibold text-foreground'>{displayName}</h2>
        </div>
        <div className='flex items-center space-x-2'>
          <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
            <Phone className='h-5 w-5' />
          </button>
          <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
            <Video className='h-5 w-5' />
          </button>
          <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
            <Pin className='h-5 w-5' />
          </button>
          <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
            <Search className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-auto p-4 space-y-4'>
        {/* Welcome header */}
        {!isLoading && (
          <div className='flex flex-col items-center text-center py-8'>
            <Avatar className='h-20 w-20 mb-4'>
              <AvatarImage
                src={dm?.recipient.avatar_url ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className='text-2xl'>
                {displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className='text-2xl font-bold text-foreground mb-2'>
              {displayName}
            </h2>
            <p className='text-muted-foreground'>
              This is the beginning of your conversation with{' '}
              <span className='font-semibold'>
                @{dm?.recipient.username ?? displayName}
              </span>
              .
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className='flex items-start space-x-3 hover:bg-accent/50 p-2 rounded group'
          >
            <button
              onClick={(e) =>
                toggleProfile(
                  {
                    id: msg.author.id,
                    username: msg.author.username,
                    avatarUrl: msg.author.avatar_url,
                  },
                  e,
                )
              }
              className='shrink-0'
            >
              <Avatar className='h-10 w-10 hover:opacity-80 transition-opacity'>
                <AvatarImage
                  src={msg.author.avatar_url ?? undefined}
                  alt={msg.author.username}
                />
                <AvatarFallback>
                  {msg.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className='flex-1 min-w-0'>
              <div className='flex items-baseline space-x-2'>
                <button
                  onClick={(e) =>
                    toggleProfile(
                      {
                        id: msg.author.id,
                        username: msg.author.username,
                        avatarUrl: msg.author.avatar_url,
                      },
                      e,
                    )
                  }
                  className='font-semibold text-foreground hover:underline'
                >
                  {msg.author.username}
                </button>
                <span className='text-xs text-muted-foreground'>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
                {me?.id === msg.author.id && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className='ml-auto opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all'
                    title='Delete message'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                )}
              </div>
              <FormattedMessage
                content={msg.content}
                className='mt-1 text-foreground'
              />
              <AttachmentList attachments={msg.attachments} />
              {extractInviteCodes(msg.content).map((code) => (
                <InviteEmbed key={code} code={code} />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <TypingIndicator
        users={typingNames}
        className='border-t border-sidebar-border bg-background pt-2'
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        channelType='dm'
        recipientName={displayName}
        typingRoom={`dm:${channelId}`}
        className='border-t-0'
      />
    </div>
  )
}
