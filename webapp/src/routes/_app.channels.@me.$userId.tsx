import { createFileRoute } from '@tanstack/react-router'
import { Phone, Video, Pin, Search, Smile, Paperclip, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export const Route = createFileRoute('/_app/channels/@me/$userId')({
  component: DMConversationPage,
})

// Mock user data
interface MockUser {
  userId: string
  username: string
  avatar: string
  status: string
  customStatus: string
}

const mockUsers: Record<string, MockUser> = {
  '935833137349541918': {
    userId: '935833137349541918',
    username: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    status: 'online',
    customStatus: 'Working on a new project',
  },
  '835833137349541919': {
    userId: '835833137349541919',
    username: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    status: 'idle',
    customStatus: 'Away from keyboard',
  },
  '735833137349541920': {
    userId: '735833137349541920',
    username: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    status: 'dnd',
    customStatus: 'Do not disturb',
  },
  '635833137349541921': {
    userId: '635833137349541921',
    username: 'Diana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    status: 'offline',
    customStatus: '',
  },
}

// Mock messages
const mockMessages = [
  {
    id: '1',
    author: 'Alice',
    authorId: '935833137349541918',
    content: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    author: 'You',
    authorId: 'current-user',
    content: "I'm doing great! Just working on some new features.",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: '3',
    author: 'Alice',
    authorId: '935833137349541918',
    content: 'That sounds awesome! What kind of features?',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: '4',
    author: 'You',
    authorId: 'current-user',
    content: 'Implementing a new chat system with real-time updates.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '5',
    author: 'Alice',
    authorId: '935833137349541918',
    content: 'Nice! Let me know if you need any help with that.',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'idle':
      return 'bg-yellow-500'
    case 'dnd':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function DMConversationPage() {
  const { userId } = Route.useParams()
  const [message, setMessage] = useState('')
  const user = mockUsers[userId]

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">User Not Found</h2>
          <p className="text-muted-foreground">This user doesn't exist or is unavailable.</p>
        </div>
      </div>
    )
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // Here you would send the message
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                getStatusColor(user.status)
              )}
            />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{user.username}</h2>
            {user.customStatus && (
              <p className="text-xs text-muted-foreground">{user.customStatus}</p>
            )}
          </div>
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
        {/* Welcome Message */}
        <div className="flex flex-col items-center text-center py-8">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="text-2xl">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground mb-2">{user.username}</h2>
          <p className="text-muted-foreground">
            This is the beginning of your direct message history with{' '}
            <span className="font-semibold">@{user.username}</span>.
          </p>
        </div>

        {/* Message List */}
        {mockMessages.map((msg) => {
          const isCurrentUser = msg.authorId === 'current-user'
          const messageUser = isCurrentUser ? null : user

          return (
            <div
              key={msg.id}
              className="flex items-start space-x-3 hover:bg-accent/50 p-2 rounded group"
            >
              <Avatar className="h-10 w-10 shrink-0">
                {messageUser ? (
                  <>
                    <AvatarImage src={messageUser.avatar} alt={messageUser.username} />
                    <AvatarFallback>
                      {messageUser.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    You
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-foreground">{msg.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-foreground mt-1 wrap-break-word">{msg.content}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-sidebar-border">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center space-x-2 bg-accent/50 rounded-lg px-4 py-3">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message @${user.username}`}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!message.trim()}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
