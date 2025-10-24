import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  isOwn?: boolean;
}

interface MessageListProps {
  messages: Message[];
  className?: string;
}

function MessageItem({ message }: { message: Message }) {
  const initials = message.author.username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn(
      "flex gap-3 p-3 hover:bg-gray-50 transition-colors",
      message.isOwn && "bg-blue-50"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.author.avatar} alt={message.author.username} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {message.author.username}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="text-sm text-gray-700 break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export function MessageList({ messages, className }: MessageListProps) {
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
