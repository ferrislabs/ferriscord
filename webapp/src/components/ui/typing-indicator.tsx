import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  users: string[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else if (users.length === 3) {
      return `${users[0]}, ${users[1]}, and ${users[2]} are typing...`;
    } else {
      return `${users[0]}, ${users[1]}, and ${users.length - 2} others are typing...`;
    }
  };

  return (
    <div className={cn("flex items-center space-x-2 px-4 py-1", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-600 italic">
        {getTypingText()}
      </span>
    </div>
  );
}
