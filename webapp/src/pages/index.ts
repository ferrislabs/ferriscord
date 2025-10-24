// Main pages exports - Domain-driven structure

// Auth domain
export * from "./auth";

// Chat domain
export * from "./chat";

// Channels domain
// export * from "./channels"; // TODO: Implement channels domain

// Servers domain
export * from "./servers";

// Users domain
// export * from "./users"; // TODO: Implement users domain

// Dashboard domain
export * from "./dashboard";

// Re-export commonly used types for convenience
export type { AuthUser, LoginCredentials, RegisterCredentials } from "./auth";

export type { Message, Channel, ChatParticipant } from "./chat";

// Domain-specific route helpers
export const ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  DASHBOARD: "/dashboard",
  CHAT: {
    CHANNEL: (channelId: string) => `/chat/channel/${channelId}`,
    DIRECT: (userId: string) => `/chat/direct/${userId}`,
  },
  SERVERS: {
    LIST: "/servers",
    DETAIL: (serverId: string) => `/servers/${serverId}`,
  },
  USERS: {
    PROFILE: (userId: string) => `/users/${userId}`,
    SETTINGS: "/users/settings",
  },
} as const;
