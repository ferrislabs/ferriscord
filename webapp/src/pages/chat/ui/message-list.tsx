import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState, useCallback, useEffect, useRef } from 'react'
import { MoreHorizontal, Reply, Smile, Copy, Trash2 } from 'lucide-react'
import { FormattedMessage } from '@/components/ui/formatted-message'
import { MessageReactions } from '@/components/ui/message-reactions'
import type { Schemas } from '@/api/api.client'
import { useProfileCardStore } from '@/stores/profile-card.store'
import { AttachmentList } from '@/components/chat/attachment-list'
import { InviteEmbed, extractInviteCodes } from '@/components/chat/invite-embed'
import { containsMention, type MentionCandidate } from '@/lib/mentions'
import type { ReplyReference } from '@/lib/reply'

interface Message {
  id: string
  content: string
  attachments?: Schemas.Attachment[]
  author: {
    id: string
    username: string
    avatar?: string
  }
  timestamp: string
  isOwn?: boolean
  replyTo?: ReplyReference | null
  reactions?: Array<{
    emoji: string
    count: number
    users: string[]
    hasReacted: boolean
  }>
}

interface MessageListProps {
  messages: Message[]
  className?: string
  onDeleteMessage?: (messageId: string) => void
  guildId?: string
  mentionCandidates?: MentionCandidate[]
  currentUsername?: string
  onReplyMessage?: (message: Message) => void
}

function shouldGroupMessages(
  currentMessage: Message,
  previousMessage: Message | null,
): boolean {
  if (!previousMessage) return false

  // Don't group if different authors
  if (currentMessage.author.id !== previousMessage.author.id) return false

  // Don't group if more than 7 minutes apart
  const currentTime = new Date(currentMessage.timestamp).getTime()
  const previousTime = new Date(previousMessage.timestamp).getTime()
  const timeDiff = currentTime - previousTime

  return timeDiff <= 7 * 60 * 1000 // 7 minutes in milliseconds
}

function MessageItem({
  message,
  isGrouped,
  showTimestamp,
  onDeleteMessage,
  guildId,
  mentionCandidates,
  currentUsername,
  onReplyMessage,
}: {
  message: Message
  isGrouped: boolean
  showTimestamp: boolean
  onDeleteMessage?: (id: string) => void
  guildId?: string
  mentionCandidates?: MentionCandidate[]
  currentUsername?: string
  onReplyMessage?: (message: Message) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const toggleProfile = useProfileCardStore((s) => s.toggle)
  const mentionsCurrentUser = containsMention(message.content, currentUsername)
  const replyAvatarUrl =
    message.replyTo?.authorAvatarUrl ??
    mentionCandidates?.find(
      (candidate) =>
        candidate.id === message.replyTo?.authorId ||
        candidate.username === message.replyTo?.authorUsername,
    )?.avatarUrl ??
    undefined

  const openProfile = useCallback(
    (e: React.MouseEvent) => {
      toggleProfile(
        {
          id: message.author.id,
          username: message.author.username,
          avatarUrl: message.author.avatar ?? null,
          guildId: guildId ?? null,
        },
        e,
      )
    },
    [message.author, toggleProfile, guildId],
  )

  const initials = message.author.username[0].toUpperCase()

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  return (
    <div
      className={cn(
        'group relative px-4 py-0.5 transition-colors duration-75',
        mentionsCurrentUser
          ? 'border-l-2 border-amber-400 bg-amber-100/60 hover:bg-amber-100/80 dark:border-amber-500 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
          : 'hover:bg-accent/40',
        isGrouped ? 'mt-0.5' : 'mt-4',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Message Actions */}
      {isHovered && (
        <div className='absolute right-6 -top-2 z-10 flex items-center rounded-md border border-border bg-popover text-popover-foreground shadow-md'>
          <button className='rounded-l-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'>
            <Smile className='w-4 h-4' />
          </button>
          <button
            className='p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            onClick={() => onReplyMessage?.(message)}
            title='Reply'
          >
            <Reply className='w-4 h-4' />
          </button>
          <button className='p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'>
            <Copy className='w-4 h-4' />
          </button>
          {message.isOwn && onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(message.id)}
              className='p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
              title='Delete message'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          )}
          <button className='rounded-r-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'>
            <MoreHorizontal className='w-4 h-4' />
          </button>
        </div>
      )}

      <div className='flex flex-col'>
        {message.replyTo && (
          <div className='mb-1 flex items-center gap-2 overflow-hidden pl-0 text-xs leading-none text-muted-foreground'>
            <div className='h-3.5 w-14 shrink-0'>
              <div className='ml-5 h-full w-8 rounded-tl-md border-l-2 border-t-2 border-border/70' />
            </div>
            <Avatar className='h-4 w-4 shrink-0'>
              <AvatarImage
                src={replyAvatarUrl}
                alt={message.replyTo.authorUsername}
              />
              <AvatarFallback className='text-[8px]'>
                {message.replyTo.authorUsername[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 items-center gap-1'>
              <button
                type='button'
                className='shrink-0 truncate text-xs font-semibold text-primary/80 hover:text-primary hover:underline'
              >
                @{message.replyTo.authorUsername}
              </button>
              <span className='truncate text-muted-foreground/90'>
                {message.replyTo.preview}
              </span>
            </div>
          </div>
        )}

        <div className='flex'>
          {/* Avatar column */}
          <div className='w-10 flex-shrink-0 mr-4'>
            {!isGrouped && (
              <button
                type='button'
                onClick={openProfile}
                className='block rounded-full focus:outline-none'
              >
                <Avatar className='h-10 w-10 shrink-0 cursor-pointer transition-opacity hover:opacity-80'>
                  <AvatarImage
                    src={message.author.avatar}
                    alt={message.author.username}
                  />
                  <AvatarFallback className='text-xs font-medium bg-indigo-500 text-white'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
            {isGrouped && showTimestamp && (
              <div className='pt-0.5 text-right text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'>
                {formatTime(message.timestamp)}
              </div>
            )}
          </div>

          {/* Message content */}
          <div className='flex-1 min-w-0'>
            {!isGrouped && (
              <div
                className={cn(
                  'flex items-baseline leading-none',
                  message.replyTo ? '-mb-0.5' : 'mb-1',
                )}
              >
                <button
                  type='button'
                  onClick={openProfile}
                  className='cursor-pointer text-sm font-semibold text-foreground hover:underline focus:outline-none'
                >
                  {message.author.username}
                </button>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {formatDate(message.timestamp)} at{' '}
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}

            <FormattedMessage
              content={message.content}
              className={cn(
                'text-[15px] leading-5 text-foreground',
                message.replyTo && '-mt-1.5',
              )}
              mentionCandidates={mentionCandidates}
              guildId={guildId}
              currentUsername={currentUsername}
            />

            {message.attachments && (
              <AttachmentList attachments={message.attachments} />
            )}

            {extractInviteCodes(message.content).map((code) => (
              <InviteEmbed key={code} code={code} />
            ))}

            {/* Message reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactions
                reactions={message.reactions}
                onAddReaction={(emoji) => {
                  // Handle add reaction - this would call an API
                  console.log('Add reaction:', emoji, 'to message:', message.id)
                }}
                onRemoveReaction={(emoji) => {
                  // Handle remove reaction - this would call an API
                  console.log(
                    'Remove reaction:',
                    emoji,
                    'from message:',
                    message.id,
                  )
                }}
                className='mt-1'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageDateSeparator({ date }: { date: string }) {
  return (
    <div className='flex items-center my-6 px-4'>
      <div className='h-px flex-1 bg-border'></div>
      <div className='rounded-lg bg-muted px-4 py-1 text-xs font-semibold text-muted-foreground'>
        {date}
      </div>
      <div className='h-px flex-1 bg-border'></div>
    </div>
  )
}

export function MessageList({
  messages,
  className,
  onDeleteMessage,
  guildId,
  mentionCandidates,
  currentUsername,
  onReplyMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      isFirstRender.current = false
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center text-muted-foreground'>
          <div className='text-4xl mb-4'>💬</div>
          <h3 className='mb-2 text-lg font-semibold text-foreground'>
            No messages yet
          </h3>
          <p className='text-sm'>
            Start the conversation by sending a message!
          </p>
        </div>
      </div>
    )
  }

  let lastMessageDate: string | null = null

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div className='pb-4'>
        {/* Welcome message */}
        <div className='px-4 pt-4 pb-2'>
          <div className='flex items-center space-x-3 mb-2'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl text-muted-foreground'>
              #
            </div>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>
                Welcome to the channel!
              </h2>
              <p className='text-muted-foreground'>
                This is the beginning of your conversation.
              </p>
            </div>
          </div>
        </div>

        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null
          const isGrouped = shouldGroupMessages(message, previousMessage)

          const messageDate = new Date(message.timestamp).toDateString()
          const shouldShowDateSeparator = lastMessageDate !== messageDate

          if (shouldShowDateSeparator) {
            lastMessageDate = messageDate
          }

          const nextMessage =
            index < messages.length - 1 ? messages[index + 1] : null
          const showTimestamp =
            !nextMessage || !shouldGroupMessages(nextMessage, message)

          return (
            <div key={message.id}>
              {shouldShowDateSeparator && (
                <MessageDateSeparator
                  date={new Date(message.timestamp).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
              )}
              <MessageItem
                message={message}
                isGrouped={isGrouped}
                showTimestamp={showTimestamp}
                onDeleteMessage={onDeleteMessage}
                guildId={guildId}
                mentionCandidates={mentionCandidates}
                currentUsername={currentUsername}
                onReplyMessage={onReplyMessage}
              />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
