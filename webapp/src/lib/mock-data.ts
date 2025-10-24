// Mock data for all domains in the FerriscordApp

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "busy" | "offline";
  isBot?: boolean;
  joinedAt: string;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  isPublic: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  serverId: string;
  type: "text" | "voice" | "announcement";
  isPrivate: boolean;
  position: number;
  memberCount?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  author: User;
  channelId: string;
  timestamp: string;
  editedAt?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  contentType: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface DirectMessage {
  id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    username: "Alice Johnson",
    email: "alice@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612e637?w=100&h=100&fit=crop&crop=face",
    status: "online",
    joinedAt: "2023-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    username: "Bob Smith",
    email: "bob@example.com",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face",
    status: "away",
    joinedAt: "2023-02-20T14:30:00Z",
  },
  {
    id: "user-3",
    username: "Charlie Brown",
    email: "charlie@example.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    status: "busy",
    joinedAt: "2023-03-10T09:15:00Z",
  },
  {
    id: "user-4",
    username: "Diana Prince",
    email: "diana@example.com",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    status: "online",
    joinedAt: "2023-01-25T16:45:00Z",
  },
  {
    id: "user-5",
    username: "Eve Wilson",
    email: "eve@example.com",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    status: "offline",
    joinedAt: "2023-04-05T11:20:00Z",
  },
  {
    id: "bot-1",
    username: "FerriscordBot",
    email: "bot@ferriscord.com",
    avatar: "🤖",
    status: "online",
    isBot: true,
    joinedAt: "2023-01-01T00:00:00Z",
  },
];

// Current user (you can change this to test different perspectives)
export const currentUser: User = mockUsers[0];

// Mock Servers
export const mockServers: Server[] = [
  {
    id: "server-1",
    name: "Rust Community",
    description:
      "A place for Rust developers to collaborate and share knowledge",
    icon: "🦀",
    ownerId: "user-1",
    memberCount: 1247,
    createdAt: "2023-01-01T00:00:00Z",
    isPublic: true,
  },
  {
    id: "server-2",
    name: "Gaming Hub",
    description: "Chat about games, organize matches, and have fun!",
    icon: "🎮",
    ownerId: "user-2",
    memberCount: 892,
    createdAt: "2023-02-15T12:00:00Z",
    isPublic: true,
  },
  {
    id: "server-3",
    name: "Design Team",
    description: "Private workspace for our design team",
    icon: "🎨",
    ownerId: "user-3",
    memberCount: 12,
    createdAt: "2023-03-01T08:30:00Z",
    isPublic: false,
  },
  {
    id: "server-4",
    name: "Open Source Projects",
    description: "Discuss and collaborate on open source projects",
    icon: "💻",
    ownerId: "user-4",
    memberCount: 567,
    createdAt: "2023-01-20T15:45:00Z",
    isPublic: true,
  },
];

// Mock Channels
export const mockChannels: Channel[] = [
  // Rust Community Server
  {
    id: "channel-1",
    name: "general",
    description: "General discussions about Rust",
    serverId: "server-1",
    type: "text",
    isPrivate: false,
    position: 0,
    memberCount: 1247,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "channel-2",
    name: "help",
    description: "Get help with Rust programming",
    serverId: "server-1",
    type: "text",
    isPrivate: false,
    position: 1,
    memberCount: 856,
    createdAt: "2023-01-01T00:05:00Z",
  },
  {
    id: "channel-3",
    name: "showcase",
    description: "Show off your Rust projects",
    serverId: "server-1",
    type: "text",
    isPrivate: false,
    position: 2,
    memberCount: 623,
    createdAt: "2023-01-01T00:10:00Z",
  },
  {
    id: "channel-4",
    name: "announcements",
    description: "Important announcements",
    serverId: "server-1",
    type: "announcement",
    isPrivate: false,
    position: 3,
    memberCount: 1247,
    createdAt: "2023-01-01T00:15:00Z",
  },

  // Gaming Hub Server
  {
    id: "channel-5",
    name: "general-chat",
    description: "General gaming discussions",
    serverId: "server-2",
    type: "text",
    isPrivate: false,
    position: 0,
    memberCount: 892,
    createdAt: "2023-02-15T12:00:00Z",
  },
  {
    id: "channel-6",
    name: "looking-for-group",
    description: "Find teammates for your games",
    serverId: "server-2",
    type: "text",
    isPrivate: false,
    position: 1,
    memberCount: 445,
    createdAt: "2023-02-15T12:05:00Z",
  },
  {
    id: "channel-7",
    name: "voice-lobby",
    description: "Voice chat for gaming sessions",
    serverId: "server-2",
    type: "voice",
    isPrivate: false,
    position: 2,
    memberCount: 23,
    createdAt: "2023-02-15T12:10:00Z",
  },

  // Design Team Server
  {
    id: "channel-8",
    name: "design-reviews",
    description: "Share and review designs",
    serverId: "server-3",
    type: "text",
    isPrivate: true,
    position: 0,
    memberCount: 12,
    createdAt: "2023-03-01T08:30:00Z",
  },
  {
    id: "channel-9",
    name: "resources",
    description: "Design resources and inspiration",
    serverId: "server-3",
    type: "text",
    isPrivate: true,
    position: 1,
    memberCount: 12,
    createdAt: "2023-03-01T08:35:00Z",
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "msg-1",
    content: "Hey everyone! Welcome to the Rust community server 🦀",
    author: mockUsers[0],
    channelId: "channel-1",
    timestamp: "2024-01-15T10:00:00Z",
    reactions: [
      {
        emoji: "👋",
        count: 5,
        users: ["user-2", "user-3", "user-4", "user-5", "bot-1"],
      },
      {
        emoji: "🦀",
        count: 8,
        users: ["user-1", "user-2", "user-3", "user-4", "user-5", "bot-1"],
      },
    ],
  },
  {
    id: "msg-2",
    content:
      "Thanks for creating this space! I'm excited to learn more about Rust.",
    author: mockUsers[1],
    channelId: "channel-1",
    timestamp: "2024-01-15T10:05:00Z",
  },
  {
    id: "msg-3",
    content:
      "I just published a new crate for async file handling. Check it out: https://crates.io/my-crate",
    author: mockUsers[2],
    channelId: "channel-1",
    timestamp: "2024-01-15T10:15:00Z",
    reactions: [
      { emoji: "🚀", count: 3, users: ["user-1", "user-4", "user-5"] },
      { emoji: "💯", count: 2, users: ["user-1", "user-4"] },
    ],
  },
  {
    id: "msg-4",
    content:
      "Can someone help me with borrowing rules? I'm getting a lifetime error.",
    author: mockUsers[3],
    channelId: "channel-2",
    timestamp: "2024-01-15T11:00:00Z",
  },
  {
    id: "msg-5",
    content: "Sure! Can you share the code snippet? I'd be happy to help.",
    author: mockUsers[0],
    channelId: "channel-2",
    timestamp: "2024-01-15T11:05:00Z",
    replyTo: "msg-4",
  },
  {
    id: "msg-6",
    content:
      'Here\'s the problematic code:\n\n```rust\nfn main() {\n    let mut vec = vec![1, 2, 3];\n    let first = &vec[0];\n    vec.push(4);\n    println!("{}", first);\n}\n```',
    author: mockUsers[3],
    channelId: "channel-2",
    timestamp: "2024-01-15T11:10:00Z",
  },
  {
    id: "msg-7",
    content:
      "The issue is that you're trying to mutate `vec` while holding an immutable reference to its content. The borrow checker prevents this because reallocating the vector could invalidate the reference.",
    author: mockUsers[1],
    channelId: "channel-2",
    timestamp: "2024-01-15T11:15:00Z",
  },
  {
    id: "msg-8",
    content:
      "Thanks! That makes sense now. I need to either clone the value or restructure my code.",
    author: mockUsers[3],
    channelId: "channel-2",
    timestamp: "2024-01-15T11:20:00Z",
    reactions: [{ emoji: "💡", count: 1, users: ["user-2"] }],
  },
  {
    id: "msg-9",
    content:
      "Just finished my first web server in Rust using Axum! It was quite a journey but I love how fast it is.",
    author: mockUsers[4],
    channelId: "channel-3",
    timestamp: "2024-01-15T14:30:00Z",
  },
  {
    id: "msg-10",
    content:
      "That's awesome! Axum is a great choice. Did you implement any middleware?",
    author: mockUsers[0],
    channelId: "channel-3",
    timestamp: "2024-01-15T14:35:00Z",
  },
  {
    id: "msg-11",
    content: "Anyone up for some Valorant? Looking for 2 more players.",
    author: mockUsers[1],
    channelId: "channel-6",
    timestamp: "2024-01-15T20:00:00Z",
  },
  {
    id: "msg-12",
    content: "I'm in! What rank are you?",
    author: mockUsers[2],
    channelId: "channel-6",
    timestamp: "2024-01-15T20:02:00Z",
  },
  {
    id: "msg-13",
    content:
      "📢 **Important Announcement**: We're upgrading our servers this weekend. Expect some downtime on Saturday from 2-4 AM UTC.",
    author: {
      id: "bot-1",
      username: "FerriscordBot",
      email: "bot@ferriscord.com",
      avatar: "🤖",
      status: "online",
      isBot: true,
      joinedAt: "2023-01-01T00:00:00Z",
    },
    channelId: "channel-4",
    timestamp: "2024-01-15T16:00:00Z",
    reactions: [
      {
        emoji: "👍",
        count: 12,
        users: ["user-1", "user-2", "user-3", "user-4", "user-5"],
      },
    ],
  },
];

// Mock Direct Messages
export const mockDirectMessages: DirectMessage[] = [
  {
    id: "dm-1",
    participants: [mockUsers[0], mockUsers[1]],
    createdAt: "2024-01-10T15:30:00Z",
    lastMessage: {
      id: "dm-msg-1",
      content: "Hey, how's the Rust project coming along?",
      author: mockUsers[1],
      channelId: "dm-1",
      timestamp: "2024-01-15T09:30:00Z",
    },
  },
  {
    id: "dm-2",
    participants: [mockUsers[0], mockUsers[2]],
    createdAt: "2024-01-12T11:15:00Z",
    lastMessage: {
      id: "dm-msg-2",
      content: "Thanks for the code review! I'll implement those changes.",
      author: mockUsers[0],
      channelId: "dm-2",
      timestamp: "2024-01-14T16:45:00Z",
    },
  },
];

// Mock Server Members (simplified - in real app this would be more complex)
export const mockServerMembers: Record<string, User[]> = {
  "server-1": [
    mockUsers[0],
    mockUsers[1],
    mockUsers[2],
    mockUsers[3],
    mockUsers[5],
  ],
  "server-2": [mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
  "server-3": [mockUsers[0], mockUsers[2], mockUsers[3]],
  "server-4": [mockUsers[0], mockUsers[1], mockUsers[4], mockUsers[5]],
};

// Helper functions for mock API calls
export const mockApi = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    if (
      credentials.email === "admin@ferriscord.com" &&
      credentials.password === "password"
    ) {
      return {
        user: currentUser,
        token: "mock-jwt-token-" + Date.now(),
      };
    }

    throw new Error("Invalid credentials");
  },

  // Messages
  getMessages: async (channelId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMessages.filter((msg) => msg.channelId === channelId);
  },

  sendMessage: async (channelId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newMessage: Message = {
      id: "msg-" + Date.now(),
      content,
      author: currentUser,
      channelId,
      timestamp: new Date().toISOString(),
    };

    // In a real app, this would be handled by the backend
    mockMessages.push(newMessage);
    return newMessage;
  },

  // Channels
  getChannels: async (serverId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockChannels.filter((channel) => channel.serverId === serverId);
  },

  // Servers
  getServers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockServers;
  },

  getServerMembers: async (serverId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockServerMembers[serverId] || [];
  },

  // Users
  getUser: async (userId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockUsers.find((user) => user.id === userId);
  },

  // Direct Messages
  getDirectMessages: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDirectMessages.filter((dm) =>
      dm.participants.some((p) => p.id === currentUser.id),
    );
  },

  getDmMessages: async (dmId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockMessages.filter((msg) => msg.channelId === dmId);
  },

  // Friends
  getFriends: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockUsers
      .filter((user) => user.id !== currentUser.id)
      .map((user) => ({
        ...user,
        status:
          Math.random() > 0.5
            ? "online"
            : Math.random() > 0.3
              ? "away"
              : "offline",
        activity: Math.random() > 0.7 ? "Playing Valorant" : undefined,
        isPremium: Math.random() > 0.8,
      }));
  },

  // DM Conversations
  getDMConversations: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const friends = await mockApi.getFriends();
    return friends.slice(0, 5).map((friend, index) => ({
      id: `dm-${friend.id}`,
      type: "dm" as const,
      participant: friend,
      lastMessage:
        index < 3
          ? {
              id: `msg-dm-${index}`,
              content: `Hey, how are you doing?`,
              author: Math.random() > 0.5 ? friend : currentUser,
              timestamp: new Date(
                Date.now() - Math.random() * 86400000,
              ).toISOString(),
            }
          : undefined,
      unreadCount: Math.floor(Math.random() * 3),
      createdAt: new Date().toISOString(),
    }));
  },

  // Public Server Discovery
  getPublicServers: async (filters?: {
    category?: string;
    sort?: string;
    search?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const publicServers = mockServers
      .filter((server) => server.isPublic)
      .map((server) => ({
        ...server,
        category: [
          "gaming",
          "music",
          "education",
          "technology",
          "art",
          "community",
          "study",
        ][Math.floor(Math.random() * 7)],
        memberCount: Math.floor(Math.random() * 50000) + 100,
      }));

    let filtered = publicServers;

    if (filters?.category && filters.category !== "all") {
      filtered = filtered.filter(
        (server) => server.category === filters.category,
      );
    }

    if (filters?.search) {
      filtered = filtered.filter(
        (server) =>
          server.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          server.description
            ?.toLowerCase()
            .includes(filters.search!.toLowerCase()),
      );
    }

    if (filters?.sort) {
      switch (filters.sort) {
        case "popular":
          filtered.sort((a, b) => b.memberCount - a.memberCount);
          break;
        case "newest":
          filtered.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          break;
        case "members":
          filtered.sort((a, b) => b.memberCount - a.memberCount);
          break;
        case "active":
          filtered.sort(() => Math.random() - 0.5); // Random for demo
          break;
      }
    }

    return filtered;
  },

  // Featured Servers
  getFeaturedServers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const publicServers = await mockApi.getPublicServers();
    return publicServers.slice(0, 6).map((server) => ({
      ...server,
      featured: true,
      memberCount: Math.floor(Math.random() * 100000) + 1000,
    }));
  },

  // Join Server
  joinServer: async (serverId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Joined server:", serverId);
    // In a real app, this would make an API call to join the server
    return { success: true };
  },
};

// Mock WebSocket events (for real-time features)
export const mockWebSocketEvents = {
  messageReceived: (callback: (message: Message) => void) => {
    // Simulate receiving messages from other users
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance every 5 seconds
        const randomUser =
          mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const randomChannel =
          mockChannels[Math.floor(Math.random() * mockChannels.length)];

        if (randomUser.id !== currentUser.id) {
          const message: Message = {
            id: "msg-" + Date.now() + "-ws",
            content: `Random message from ${randomUser.username}`,
            author: randomUser,
            channelId: randomChannel.id,
            timestamp: new Date().toISOString(),
          };

          callback(message);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  },

  userStatusChanged: (
    callback: (userId: string, status: User["status"]) => void,
  ) => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance every 10 seconds
        const randomUser =
          mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const statuses: User["status"][] = [
          "online",
          "away",
          "busy",
          "offline",
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        callback(randomUser.id, randomStatus);
      }
    }, 10000);

    return () => clearInterval(interval);
  },
};

// Local storage helpers for persistence
export const mockStorage = {
  setAuthToken: (token: string) => {
    localStorage.setItem("ferriscord_auth_token", token);
  },

  getAuthToken: () => {
    return localStorage.getItem("ferriscord_auth_token");
  },

  removeAuthToken: () => {
    localStorage.removeItem("ferriscord_auth_token");
  },

  setUser: (user: User) => {
    localStorage.setItem("ferriscord_user", JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem("ferriscord_user");
    return userData ? JSON.parse(userData) : null;
  },

  removeUser: () => {
    localStorage.removeItem("ferriscord_user");
  },
};
