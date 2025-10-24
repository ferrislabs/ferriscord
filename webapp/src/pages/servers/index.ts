// Servers domain exports
export { ServersFeature } from "./features/servers";
export { ServerList } from "./ui/server-list";

// Types
export interface ServerMember {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isBot?: boolean;
}

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
  mentionable: boolean;
}

export interface ServerInvite {
  id: string;
  code: string;
  serverId: string;
  channelId: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface ServerSettings {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  isPublic: boolean;
  verificationLevel: 'none' | 'low' | 'medium' | 'high';
  defaultNotifications: 'all' | 'mentions';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
}

export interface CreateServerData {
  name: string;
  description?: string;
  icon?: File;
  isPublic: boolean;
  template?: string;
}

export interface JoinServerData {
  inviteCode: string;
}
