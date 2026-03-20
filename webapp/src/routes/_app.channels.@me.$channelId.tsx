import { createFileRoute } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { Phone, Video, Pin, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageInput } from '@/components/chat'
import { useDmMessages, useSendDmMessage, useListDms } from '@/lib/queries/dm-queries'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/channels/@me/$channelId')({
  component: DMConversationPage,
})

function DMConversationPage() {
  const { channelId } = Route.useParams()
  const { data: dms = [] } = useListDms()
  const { data: messages = [], isLoading } = useDmMessages(channelId)
  const sendMessage = useSendDmMessage(channelId)
  const bottomRef = useRef<HTMLDivElement>(null)

  const dm = dms.find((d) => d.id === channelId)
  const displayName = dm ? (dm.recipient.display_name ?? dm.recipient.username) : '...'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSendMessage = (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return
    sendMessage.mutate(
      { content, files },
      {
        onError: () => toast.error('Impossible d\'envoyer le message'),
      },
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={dm?.recipient.avatar_url ?? undefined}
              alt={displayName}
            />
            <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold text-foreground">{displayName}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Pin className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Welcome header */}
        {!isLoading && (
          <div className="flex flex-col items-center text-center py-8">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={dm?.recipient.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="text-2xl">
                {displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground mb-2">{displayName}</h2>
            <p className="text-muted-foreground">
              Début de votre conversation avec{' '}
              <span className="font-semibold">@{dm?.recipient.username ?? displayName}</span>.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start space-x-3 hover:bg-accent/50 p-2 rounded group"
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={msg.author.avatar_url ?? undefined} alt={msg.author.username} />
              <AvatarFallback>{msg.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-foreground">{msg.author.username}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-foreground mt-1 break-words">{msg.content}</p>
              {msg.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline block"
                    >
                      {att.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        channelType="dm"
        recipientName={displayName}
        className="border-t-0"
      />
    </div>
  )
}
