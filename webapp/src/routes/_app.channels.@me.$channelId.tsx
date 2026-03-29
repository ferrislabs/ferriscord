import { createFileRoute } from '@tanstack/react-router'
import { useRef, useEffect, useState } from 'react'
import { Phone, Video, Pin, Search, Trash2, Menu, Reply } from 'lucide-react'
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
import {
  getReplyPreview,
  parseReplyContent,
  type ReplyReference,
} from '@/lib/reply'

const EMPTY_TYPING_USERS: Array<{ userId: string; username: string }> = []

export const Route = createFileRoute('/_app/channels/@me/$channelId')({
  component: DMConversationPage,
})

function DMConversationPage() {
  const { channelId } = Route.useParams()
  const { setCollapsed } = useSidebar()
  const toggleProfile = useProfileCardStore((s) => s.toggle)
  const clearDmUnread = useNotificationStore((s) => s.clearDmUnread)
  const [replyTarget, setReplyTarget] = useState<ReplyReference | null>(null)
  const [replyMentionEnabled, setReplyMentionEnabled] = useState(true)

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
  const dmMentionCandidates = dm
    ? [
        {
          id: dm.recipient.id,
          username: dm.recipient.username,
          displayName,
          avatarUrl: dm.recipient.avatar_url ?? undefined,
        },
      ]
    : []
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

  const handleReplyMessage = (message: {
    id: string
    content: string
    author: { id: string; username: string; avatarUrl?: string }
  }) => {
    setReplyTarget({
      messageId: message.id,
      authorId: message.author.id,
      authorUsername: message.author.username,
      authorAvatarUrl: message.author.avatarUrl,
      preview: getReplyPreview(message.content),
    })
    setReplyMentionEnabled(true)
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

        {messages.map((msg) => {
          const parsed = parseReplyContent(msg.content)
          const displayMessage = {
            id: msg.id,
            content: parsed.body,
            replyTo: parsed.reply,
            author: {
              id: msg.author.id,
              username: msg.author.username,
              avatarUrl: msg.author.avatar_url ?? undefined,
            },
          }
          const replyAvatarUrl =
            displayMessage.replyTo?.authorAvatarUrl ??
            (displayMessage.replyTo?.authorId === dm?.recipient.id ||
            displayMessage.replyTo?.authorUsername === dm?.recipient.username
              ? (dm?.recipient.avatar_url ?? undefined)
              : displayMessage.replyTo?.authorId === me?.id ||
                  displayMessage.replyTo?.authorUsername === me?.username
                ? (me?.avatar_url ?? undefined)
                : undefined)

          return (
            <div key={msg.id} className='rounded p-2 hover:bg-accent/50 group'>
              <div className='flex min-w-0 flex-col'>
                {displayMessage.replyTo && (
                  <div className='mb-1 flex items-center gap-2 overflow-hidden pl-1 text-xs leading-none text-muted-foreground'>
                    <div className='h-3.5 w-14 shrink-0'>
                      <div className='ml-5 h-full w-4 rounded-tl-md border-l-2 border-t-2 border-border/70' />
                    </div>
                    <Avatar className='h-4 w-4 shrink-0'>
                      <AvatarImage
                        src={replyAvatarUrl}
                        alt={displayMessage.replyTo.authorUsername}
                      />
                      <AvatarFallback className='text-[8px]'>
                        {displayMessage.replyTo.authorUsername[0]?.toUpperCase() ??
                          '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex min-w-0 items-center gap-1'>
                      <span className='shrink-0 truncate text-xs font-semibold text-primary/80'>
                        @{displayMessage.replyTo.authorUsername}
                      </span>
                      <span className='truncate text-muted-foreground/90'>
                        {displayMessage.replyTo.preview}
                      </span>
                    </div>
                  </div>
                )}

                <div className='flex items-start space-x-3'>
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
                    className='block shrink-0'
                  >
                    <Avatar className='h-10 w-10 shrink-0 transition-opacity hover:opacity-80'>
                      <AvatarImage
                        src={msg.author.avatar_url ?? undefined}
                        alt={msg.author.username}
                      />
                      <AvatarFallback>
                        {msg.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className='min-w-0 flex-1'>
                    <div
                      className={
                        displayMessage.replyTo
                          ? '-mb-0.5 flex items-center space-x-2 leading-none'
                          : 'mb-0.5 flex items-center space-x-2 leading-none'
                      }
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
                        className='font-semibold text-foreground hover:underline'
                      >
                        {msg.author.username}
                      </button>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => handleReplyMessage(displayMessage)}
                        className='p-1 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100'
                        title='Reply'
                      >
                        <Reply className='h-4 w-4' />
                      </button>
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
                      content={displayMessage.content}
                      className={
                        displayMessage.replyTo
                          ? '-mt-1.5 text-[15px] leading-5 text-foreground'
                          : 'text-[15px] leading-5 text-foreground'
                      }
                      mentionCandidates={dmMentionCandidates}
                      currentUsername={me?.username}
                    />
                    <AttachmentList attachments={msg.attachments} />
                    {extractInviteCodes(msg.content).map((code) => (
                      <InviteEmbed key={code} code={code} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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
        mentionCandidates={dmMentionCandidates}
        typingRoom={`dm:${channelId}`}
        replyTarget={replyTarget}
        replyMentionEnabled={replyMentionEnabled}
        onToggleReplyMention={() => setReplyMentionEnabled((value) => !value)}
        onCancelReply={() => setReplyTarget(null)}
        className='border-t-0'
      />
    </div>
  )
}
