import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { MessageList } from "../ui/message-list";
import { MessageInput } from "../ui/message-input";
import { cn } from "@/lib/utils";
import { mockApi, mockWebSocketEvents, Message } from "@/lib/mock-data";



interface ChatRoomProps {
  channelId: string;
  currentUserId: string;
  className?: string;
}



export function ChatRoomFeature({ channelId, currentUserId, className }: ChatRoomProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => mockApi.getMessages(channelId),
    enabled: !!channelId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => mockApi.sendMessage(channelId, content),
    onSuccess: (newMessage) => {
      // Optimistically update the messages
      queryClient.setQueryData(["messages", channelId], (oldMessages: Message[] = []) => [
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
            queryClient.setQueryData(["messages", channelId], (oldMessages: Message[] = []) => [
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
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          Connecting to chat...
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
        placeholder={
          isConnected
            ? `Message #${channelId}`
            : "Connecting to chat..."
        }
      />
    </div>
  );
}
