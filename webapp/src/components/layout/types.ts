export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'away' | 'busy';
export type ChannelType = 'text' | 'voice' | 'announcement';

export interface BaseUser {
  id: string;
  username: string;
  avatar?: string;
  status?: UserStatus;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  memberCount?: number;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
}

export interface Member extends BaseUser {
  status: UserStatus;
  isBot?: boolean;
}
