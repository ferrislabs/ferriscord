// Chat domain exports
export { ChatRoomFeature } from "./features/chat-room";
export { MessageList } from "./ui/message-list";
export { MessageInput } from "./ui/message-input";

// Types
export interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  channelId: string;
  isOwn?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  serverId: string;
  isPrivate: boolean;
  memberCount?: number;
}

export interface ChatParticipant {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}
