import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { MessageList } from "../ui/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { cn } from "@/lib/utils";
import { mockApi, mockWebSocketEvents, type Message } from "@/lib/mock-data";

interface ChatRoomProps {
  channelId: string;
  currentUserId: string;
  channelName?: string;
  className?: string;
  isDM?: boolean;
}



export function ChatRoomFeature({ channelId, currentUserId, channelName, className, isDM = false }: ChatRoomProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch messages (different API call for DMs vs channels)
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["messages", channelId, isDM ? "dm" : "channel"],
    queryFn: () => isDM ? mockApi.getDmMessagesByUserId(channelId) : mockApi.getMessages(channelId),
    enabled: !!channelId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => mockApi.sendMessage(channelId, content),
    onSuccess: (newMessage) => {
      // Optimistically update the messages
      queryClient.setQueryData(["messages", channelId, isDM ? "dm" : "channel"], (oldMessages: Message[] = []) => [
        ...oldMessages,
        newMessage,
      ]);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      // You could show a toast notification here
    },
  });

  // WebSocket connection for real-time updates (mock implementation)
  useEffect(() => {
    if (!channelId) return;

    // Mock WebSocket connection
    const connectWebSocket = () => {
      try {
        // Mock connection
        setIsConnected(true);

        // Set up mock message receiving
        const cleanup = mockWebSocketEvents.messageReceived((message) => {
          if (message.channelId === channelId) {
            queryClient.setQueryData(["messages", channelId, isDM ? "dm" : "channel"], (oldMessages: Message[] = []) => [
              ...oldMessages,
              message,
            ]);
          }
        });

        return cleanup;
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        setIsConnected(false);
      }
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, [channelId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add current user info to messages for UI purposes
  const messagesWithOwnership = messages.map((message) => ({
    ...message,
    isOwn: message.author.id === currentUserId,
    reactions: message.reactions?.map(reaction => ({
      ...reaction,
      hasReacted: reaction.users.includes(currentUserId)
    }))
  }));

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Failed to load messages. Please try again.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 px-4 py-2 text-sm text-yellow-800">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
            <span>Reconnecting to chat...</span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messagesWithOwnership} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        disabled={!isConnected}
        channelName={channelName || channelId}
        placeholder={
          !isConnected
            ? "Connecting to chat..."
            : undefined
        }
      />
    </div>
  );
}
