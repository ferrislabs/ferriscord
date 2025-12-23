import { createFileRoute, Link } from '@tanstack/react-router'
import { Inbox, Search, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/channels/@me')({
  component: DMListPage,
})

// Mock DM conversations
const mockDMConversations = [
  {
    userId: '935833137349541918',
    username: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    status: 'online',
    lastMessage: 'Hey, how are you doing?',
    timestamp: '2m ago',
    unread: 2,
  },
  {
    userId: '835833137349541919',
    username: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    status: 'idle',
    lastMessage: 'Did you see the new update?',
    timestamp: '1h ago',
    unread: 0,
  },
  {
    userId: '735833137349541920',
    username: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    status: 'dnd',
    lastMessage: 'Thanks for your help!',
    timestamp: '3h ago',
    unread: 0,
  },
  {
    userId: '635833137349541921',
    username: 'Diana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    status: 'offline',
    lastMessage: 'See you tomorrow',
    timestamp: '1d ago',
    unread: 0,
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

function DMListPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-2">
          <Inbox className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Direct Messages</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Friends Section */}
        <div className="p-4">
          <Link to="/channels/@me">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Friends</span>
            </div>
          </Link>
        </div>

        {/* Direct Messages List */}
        <div className="px-4 pb-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
            Direct Messages
          </div>
          {mockDMConversations.map((dm) => (
            <Link
              key={dm.userId}
              to="/channels/@me/$userId"
              params={{ userId: dm.userId }}
            >
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={dm.avatar} alt={dm.username} />
                    <AvatarFallback>
                      {dm.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                      getStatusColor(dm.status)
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate">
                      {dm.username}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {dm.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {dm.lastMessage}
                    </p>
                    {dm.unread > 0 && (
                      <span className="shrink-0 ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {dm.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State (if no conversations) */}
        {mockDMConversations.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                No Direct Messages
              </h2>
              <p className="text-muted-foreground mb-6">
                You don't have any direct messages yet. Start a conversation with your friends!
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
