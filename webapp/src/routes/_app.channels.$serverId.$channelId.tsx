import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Hash,
  Volume2,
  Users,
  Pin,
  Bell,
  Search,
  Menu,
  ChevronRight,
  MessageSquarePlus,
  List,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageListSkeleton } from '@/components/layout/message-list-skeleton'
import { MessageInput } from '@/components/chat'
import { MessageList } from '@/pages/chat/ui/message-list'
import { saveLastVisited, saveGuildLastChannel } from '@/lib/last-visited'
import { useUserGuilds } from '@/lib/queries/guild-queries'
import {
  useCreateChannel,
  useGuildChannels,
} from '@/lib/queries/channel-queries'
import {
  useChannelMessages,
  useSendMessage,
  useDeleteMessage,
} from '@/lib/queries/message-queries'
import { useGuildMembers, useGuildRoles } from '@/lib/queries/member-queries'
import { useGetMe } from '@/lib/queries/user-queries'
import { useWsRoom } from '@/hooks/use-ws-events'
import { MemberList } from '@/components/guild/member-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { canSendMessagesInChannel } from '@/lib/channel-permissions'
import { useSidebar } from '@/components/ui/sidebar'
import { useNotificationStore } from '@/stores/notification.store'
import { useTypingStore } from '@/stores/typing.store'
import { TypingIndicator } from '@/components/ui/typing-indicator'
import { toast } from '@/lib/toast'
import {
  getReplyPreview,
  parseReplyContent,
  type ReplyReference,
} from '@/lib/reply'
import {
  buildThreadNoticeContent,
  parseThreadNoticeContent,
  type ThreadReference,
} from '@/lib/thread'

const EMPTY_TYPING_USERS: Array<{ userId: string; username: string }> = []

export const Route = createFileRoute('/_app/channels/$serverId/$channelId')({
  component: ChannelPage,
})

function ChannelPage() {
  const { serverId, channelId } = Route.useParams()
  const { setCollapsed } = useSidebar()
  const navigate = useNavigate()
  const clearGuildMentions = useNotificationStore((s) => s.clearGuildMentions)
  const [showMemberList, setShowMemberList] = useState(
    () => localStorage.getItem('memberListOpen') === 'true',
  )
  const [replyTarget, setReplyTarget] = useState<ReplyReference | null>(null)
  const [replyMentionEnabled, setReplyMentionEnabled] = useState(true)
  const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false)
  const [isThreadListOpen, setIsThreadListOpen] = useState(false)
  const [threadName, setThreadName] = useState('')
  const [threadSearch, setThreadSearch] = useState('')
  const [threadSourceMessage, setThreadSourceMessage] =
    useState<ThreadReference | null>(null)

  const { data: guilds = [], isPending: isGuildsPending } = useUserGuilds()

  useEffect(() => {
    if (isGuildsPending) return
    if (guilds.length === 0 || !guilds.find((g) => g.id === serverId)) {
      saveLastVisited('/channels/@me')
      navigate({ to: '/channels/@me', replace: true })
    }
  }, [isGuildsPending, guilds, serverId, navigate])

  useEffect(() => {
    localStorage.setItem('memberListOpen', String(showMemberList))
  }, [showMemberList])

  useWsRoom(`channel:${channelId}`)
  // Always subscribe to the guild room so presence changes are broadcast
  // to/from this user even when the member list panel is closed.
  useWsRoom(`guild:${serverId}`)

  useEffect(() => {
    saveLastVisited(`/channels/${serverId}/${channelId}`)
    saveGuildLastChannel(serverId, channelId)
    clearGuildMentions(serverId)
  }, [serverId, channelId, clearGuildMentions])

  const { data: channels = [], isLoading: isLoadingChannels } =
    useGuildChannels(serverId)
  const { data: guildMembers = [] } = useGuildMembers(serverId)
  const { data: guildRolesData = { data: [] } } = useGuildRoles(serverId)
  const { data: messages = [], isLoading: isLoadingMessages } =
    useChannelMessages(serverId, channelId)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(
    serverId,
    channelId,
  )
  const { mutate: deleteMessage } = useDeleteMessage(serverId, channelId)
  const createChannel = useCreateChannel()
  const { data: me } = useGetMe()
  const typingUsers = useTypingStore(
    (state) => state.typingByRoom[`channel:${channelId}`] ?? EMPTY_TYPING_USERS,
  )

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId)
  }

  const selectedChannel = channels.find((ch) => ch.id === channelId)
  const currentMember = guildMembers.find((member) => member.user_id === me?.id)
  const canSendMessages = canSendMessagesInChannel({
    channel: selectedChannel,
    channels,
    roles: guildRolesData.data,
    member: currentMember,
  })
  const parentTextChannel = selectedChannel?.parent_id
    ? channels.find(
        (channel) =>
          channel.id === selectedChannel.parent_id && channel.kind === 'Text',
      )
    : undefined
  const threadRootChannel =
    parentTextChannel ??
    (selectedChannel?.kind === 'Text' ? selectedChannel : undefined)
  const threadChannels = threadRootChannel
    ? channels
        .filter(
          (channel) =>
            channel.kind === 'Text' &&
            channel.parent_id === threadRootChannel.id,
        )
        .sort((a, b) => a.position - b.position)
    : []
  const filteredThreadChannels = threadChannels.filter((thread) =>
    thread.name.toLowerCase().includes(threadSearch.toLowerCase()),
  )
  const isThreadChannel = !!parentTextChannel
  const canCreateThreads =
    !!selectedChannel && selectedChannel.kind === 'Text' && !isThreadChannel
  const isLoading = isLoadingChannels

  const handleSendMessage = (content: string, files?: File[]) => {
    sendMessage({ content, files })
  }

  const handleCreateThread = () => {
    if (!serverId || !selectedChannel || !threadName.trim()) return

    createChannel.mutate(
      {
        path: { guild_id: serverId },
        body: {
          name: threadName.trim(),
          kind: 'Text',
          parent_id: selectedChannel.id,
        },
      },
      {
        onSuccess: (channel) => {
          sendMessage({
            content: buildThreadNoticeContent({
              threadId: channel.id,
              threadName: channel.name,
              sourceMessageId: threadSourceMessage?.sourceMessageId,
              sourceAuthorUsername: threadSourceMessage?.sourceAuthorUsername,
              sourcePreview: threadSourceMessage?.sourcePreview,
            }),
          })
          setThreadName('')
          setThreadSourceMessage(null)
          setIsCreateThreadOpen(false)
          navigate({
            to: '/channels/$serverId/$channelId',
            params: { serverId, channelId: channel.id },
          })
          toast.success('Thread created')
        },
        onError: () => {
          toast.error('Failed to create thread')
        },
      },
    )
  }

  const handleReplyMessage = (message: {
    id: string
    content: string
    author: { id: string; username: string; avatar?: string }
  }) => {
    setReplyTarget({
      messageId: message.id,
      authorId: message.author.id,
      authorUsername: message.author.username,
      authorAvatarUrl: message.author.avatar,
      preview: getReplyPreview(message.content),
    })
    setReplyMentionEnabled(true)
  }

  const handleCreateThreadFromMessage = (message: {
    id: string
    content: string
    author: { username: string }
  }) => {
    const defaultThreadName = getReplyPreview(message.content)
    setThreadSourceMessage({
      threadId: '',
      threadName: defaultThreadName,
      sourceMessageId: message.id,
      sourceAuthorUsername: message.author.username,
      sourcePreview: getReplyPreview(message.content),
    })
    setThreadName(defaultThreadName)
    setIsCreateThreadOpen(true)
  }

  // Map API messages to MessageList format
  const formattedMessages = messages.map((msg) => {
    const threadParsed = parseThreadNoticeContent(msg.content)
    const parsed = parseReplyContent(threadParsed.body)
    return {
      id: msg.id,
      content: parsed.body,
      replyTo: parsed.reply,
      threadNotice: threadParsed.thread,
      attachments: msg.attachments,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        avatar: msg.author.avatar_url ?? undefined,
      },
      timestamp: msg.created_at,
      isOwn: me?.id === msg.author.id,
    }
  })
  const mentionCandidates = guildMembers.map((member) => ({
    id: member.user_id,
    username: member.username,
    displayName: member.display_name ?? member.username,
    avatarUrl: member.avatar_url ?? undefined,
  }))
  const typingNames = typingUsers.map((user) => {
    const member = guildMembers.find((entry) => entry.user_id === user.userId)
    return member?.display_name ?? member?.username ?? user.username
  })

  return (
    <div className='flex flex-col h-full'>
      {/* Channel Header */}
      {isLoading ? (
        <div className='h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background'>
          <div className='flex items-center space-x-2'>
            <Skeleton className='h-5 w-5' />
            <Skeleton className='h-5 w-32' />
          </div>
          <div className='flex items-center space-x-2'>
            <Skeleton className='h-8 w-8 rounded' />
            <Skeleton className='h-8 w-8 rounded' />
            <Skeleton className='h-8 w-8 rounded' />
            <Skeleton className='h-8 w-8 rounded' />
          </div>
        </div>
      ) : (
        selectedChannel && (
          <div className='border-b border-sidebar-border bg-background'>
            <div className='h-12 px-4 flex items-center justify-between'>
              <div className='flex min-w-0 items-center space-x-2'>
                <button
                  className='md:hidden p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'
                  onClick={() => setCollapsed(false)}
                >
                  <Menu className='h-5 w-5' />
                </button>
                {selectedChannel.kind === 'Voice' ? (
                  <Volume2 className='h-5 w-5 text-muted-foreground' />
                ) : (
                  <Hash className='h-5 w-5 text-muted-foreground' />
                )}
                {parentTextChannel && (
                  <>
                    <button
                      className='shrink-0 text-sm text-muted-foreground hover:text-foreground'
                      onClick={() =>
                        navigate({
                          to: '/channels/$serverId/$channelId',
                          params: { serverId, channelId: parentTextChannel.id },
                        })
                      }
                    >
                      {parentTextChannel.name}
                    </button>
                    <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
                  </>
                )}
                <h2 className='truncate font-semibold text-foreground'>
                  {selectedChannel.name}
                </h2>
                {selectedChannel.topic && (
                  <>
                    <span className='text-muted-foreground'>|</span>
                    <span className='truncate text-sm text-muted-foreground'>
                      {selectedChannel.topic}
                    </span>
                  </>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                {threadRootChannel && (
                  <DropdownMenu
                    open={isThreadListOpen}
                    onOpenChange={setIsThreadListOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'
                        title='Open thread list'
                      >
                        <List className='h-5 w-5' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      side='bottom'
                      sideOffset={12}
                      className='w-[min(42rem,calc(100vw-1rem))] border-border bg-card p-0'
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className='border-b border-border px-4 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center gap-2 border-r border-border pr-4'>
                            <List className='h-5 w-5 text-muted-foreground' />
                            <div className='text-lg font-semibold text-foreground'>
                              Threads
                            </div>
                          </div>
                          <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                            <Input
                              value={threadSearch}
                              onChange={(e) => setThreadSearch(e.target.value)}
                              placeholder='Search for Thread Name'
                              className='h-10 pl-10 text-sm'
                            />
                          </div>
                          {canCreateThreads && (
                            <Button
                              onClick={() => {
                                setIsThreadListOpen(false)
                                setThreadSourceMessage(null)
                                setThreadName('')
                                setIsCreateThreadOpen(true)
                              }}
                              className='h-10 px-4 text-sm'
                            >
                              Create
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className='no-scrollbar max-h-[26rem] overflow-y-auto bg-card px-4 py-4'>
                        <div className='mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          {filteredThreadChannels.length} Joined Threads
                        </div>
                        <div className='space-y-3'>
                          {filteredThreadChannels.map((thread) => (
                            <button
                              key={thread.id}
                              onClick={() => {
                                setIsThreadListOpen(false)
                                navigate({
                                  to: '/channels/$serverId/$channelId',
                                  params: { serverId, channelId: thread.id },
                                })
                              }}
                              className={cn(
                                'flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-accent/20',
                                thread.id === channelId && 'border-primary/60',
                              )}
                            >
                              <div className='min-w-0'>
                                <div className='truncate text-base font-semibold text-foreground'>
                                  {thread.name}
                                </div>
                                <div className='mt-1 text-sm text-muted-foreground'>
                                  Open thread
                                </div>
                              </div>
                              <div className='ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                                <Hash className='h-4 w-4' />
                              </div>
                            </button>
                          ))}
                          {filteredThreadChannels.length === 0 && (
                            <div className='rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground'>
                              No threads found.
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {canCreateThreads && (
                  <button
                    onClick={() => {
                      setThreadSourceMessage(null)
                      setThreadName('')
                      setIsCreateThreadOpen(true)
                    }}
                    className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'
                    title='Create thread'
                  >
                    <MessageSquarePlus className='h-5 w-5' />
                  </button>
                )}
                <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
                  <Bell className='h-5 w-5' />
                </button>
                <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
                  <Pin className='h-5 w-5' />
                </button>
                <button
                  onClick={() => setShowMemberList((v) => !v)}
                  className={cn(
                    'p-2 rounded text-muted-foreground hover:text-foreground transition-colors',
                    showMemberList
                      ? 'bg-accent text-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  <Users className='h-5 w-5' />
                </button>
                <button className='p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors'>
                  <Search className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Channel Content */}
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-col flex-1 overflow-hidden'>
          {isLoading || isLoadingMessages ? (
            <MessageListSkeleton />
          ) : selectedChannel ? (
            <MessageList
              messages={formattedMessages}
              className='flex-1'
              onDeleteMessage={handleDeleteMessage}
              guildId={serverId}
              mentionCandidates={mentionCandidates}
              currentUsername={me?.username}
              onReplyMessage={handleReplyMessage}
              onCreateThreadMessage={handleCreateThreadFromMessage}
            />
          ) : (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <Hash className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                <h2 className='text-xl font-semibold text-foreground mb-2'>
                  No Channel Selected
                </h2>
                <p className='text-muted-foreground'>
                  Select a channel from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}

          {/* Message Input */}
          {isLoading ? (
            <div className='p-4 border-t border-sidebar-border'>
              <Skeleton className='h-12 w-full rounded-lg' />
            </div>
          ) : (
            selectedChannel && (
              <>
                <TypingIndicator
                  users={typingNames}
                  className='border-t border-sidebar-border bg-background pt-2'
                />
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isLoading={isSending}
                  disabled={!canSendMessages}
                  placeholder={
                    canSendMessages
                      ? undefined
                      : 'You do not have permission to send messages in this channel'
                  }
                  channelName={selectedChannel.name}
                  channelType='text'
                  mentionCandidates={mentionCandidates}
                  typingRoom={`channel:${channelId}`}
                  replyTarget={replyTarget}
                  replyMentionEnabled={replyMentionEnabled}
                  onToggleReplyMention={() =>
                    setReplyMentionEnabled((value) => !value)
                  }
                  onCancelReply={() => setReplyTarget(null)}
                  className='border-t-0'
                />
              </>
            )
          )}
        </div>
        {showMemberList && (
          <MemberList guildId={serverId} className='hidden md:flex' />
        )}
      </div>

      <Dialog open={isCreateThreadOpen} onOpenChange={setIsCreateThreadOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Create Thread</DialogTitle>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateThread()
            }}
          >
            {threadSourceMessage?.sourcePreview && (
              <div className='rounded-md border border-border/70 bg-accent/30 px-3 py-2 text-sm'>
                <div className='font-medium text-foreground'>
                  From @{threadSourceMessage.sourceAuthorUsername}
                </div>
                <div className='truncate text-xs text-muted-foreground'>
                  {threadSourceMessage.sourcePreview}
                </div>
              </div>
            )}
            <Input
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              placeholder='release-planning'
              maxLength={100}
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsCreateThreadOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={createChannel.isPending || !threadName.trim()}
              >
                {createChannel.isPending ? 'Creating...' : 'Create Thread'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
