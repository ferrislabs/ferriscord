import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import type {
  CreateServerInput,
  PaginatedResponse,
  Server,
  Channel,
  ServerMember,
} from "./community-types";

// Mock data for servers
const mockServers: Server[] = [
  {
    id: 1,
    name: "Gaming Hub",
    description: "A community for gamers",
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=gaming",
    banner_url: null,
    visibility: "Public",
    created_at: new Date().toISOString(),
    member_count: 1234,
  },
  {
    id: 2,
    name: "Tech Talk",
    description: "Discuss the latest in technology",
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=tech",
    banner_url: null,
    visibility: "Public",
    created_at: new Date().toISOString(),
    member_count: 567,
  },
  {
    id: 3,
    name: "Art Gallery",
    description: "Share and appreciate art",
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=art",
    banner_url: null,
    visibility: "Public",
    created_at: new Date().toISOString(),
    member_count: 890,
  },
  {
    id: 4,
    name: "Music Lovers",
    description: "All about music",
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=music",
    banner_url: null,
    visibility: "Public",
    created_at: new Date().toISOString(),
    member_count: 432,
  },
  {
    id: 5,
    name: "Book Club",
    description: "Read and discuss books",
    picture_url: "https://api.dicebear.com/7.x/shapes/svg?seed=books",
    banner_url: null,
    visibility: "Public",
    created_at: new Date().toISOString(),
    member_count: 321,
  },
];

const mockChannels: Record<number, Channel[]> = {
  1: [
    { id: 101, server_id: 1, name: "general", type: "text", position: 0 },
    { id: 102, server_id: 1, name: "gaming-news", type: "text", position: 1 },
    { id: 103, server_id: 1, name: "voice-chat", type: "voice", position: 2 },
  ],
  2: [
    { id: 201, server_id: 2, name: "general", type: "text", position: 0 },
    { id: 202, server_id: 2, name: "programming", type: "text", position: 1 },
    {
      id: 203,
      server_id: 2,
      name: "tech-news",
      type: "announcement",
      position: 2,
    },
  ],
  3: [
    { id: 301, server_id: 3, name: "general", type: "text", position: 0 },
    { id: 302, server_id: 3, name: "showcase", type: "text", position: 1 },
  ],
  4: [
    { id: 401, server_id: 4, name: "general", type: "text", position: 0 },
    {
      id: 402,
      server_id: 4,
      name: "recommendations",
      type: "text",
      position: 1,
    },
  ],
  5: [
    { id: 501, server_id: 5, name: "general", type: "text", position: 0 },
    { id: 502, server_id: 5, name: "current-reads", type: "text", position: 1 },
  ],
};

const mockMembers: Record<number, ServerMember[]> = {
  1: [
    { id: 1, server_id: 1, user_id: 1, username: "Admin", role: "owner" },
    { id: 2, server_id: 1, user_id: 2, username: "Moderator1", role: "admin" },
    { id: 3, server_id: 1, user_id: 3, username: "Member1", role: "member" },
  ],
  2: [
    { id: 4, server_id: 2, user_id: 1, username: "TechLead", role: "owner" },
    { id: 5, server_id: 2, user_id: 4, username: "DevOps", role: "admin" },
  ],
  3: [
    { id: 6, server_id: 3, user_id: 5, username: "ArtDirector", role: "owner" },
  ],
  4: [
    { id: 7, server_id: 4, user_id: 6, username: "MusicMaster", role: "owner" },
  ],
  5: [
    { id: 8, server_id: 5, user_id: 7, username: "Librarian", role: "owner" },
  ],
};

// Mock API functions
const mockFetchServers = async (
  page: number = 0,
  pageSize: number = 10,
): Promise<PaginatedResponse<Server>> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const start = page * pageSize;
  const end = start + pageSize;
  const paginatedData = mockServers.slice(start, end);

  return {
    data: paginatedData,
    page,
    page_size: pageSize,
    total: mockServers.length,
    has_more: end < mockServers.length,
  };
};

const mockCreateServer = async (input: CreateServerInput): Promise<Server> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newServer: Server = {
    id: mockServers.length + 1,
    name: input.name,
    description: input.description,
    picture_url: input.picture_url || null,
    banner_url: input.banner_url || null,
    visibility: input.visibility,
    created_at: new Date().toISOString(),
    member_count: 1,
  };

  mockServers.push(newServer);
  return newServer;
};

const mockFetchServerById = async (
  serverId: number,
): Promise<Server | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockServers.find((s) => s.id === serverId) || null;
};

const mockFetchChannels = async (serverId: number): Promise<Channel[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockChannels[serverId] || [];
};

const mockFetchMembers = async (serverId: number): Promise<ServerMember[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockMembers[serverId] || [];
};

// React Query hooks
export function useServers(pageSize: number = 10) {
  return useInfiniteQuery({
    queryKey: ["servers"],
    queryFn: ({ pageParam = 0 }) => mockFetchServers(pageParam, pageSize),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
  });
}

export function useServer(serverId: number) {
  return useQuery({
    queryKey: ["server", serverId],
    queryFn: () => mockFetchServerById(serverId),
    enabled: !!serverId,
  });
}

export function useChannels(serverId: number) {
  return useQuery({
    queryKey: ["channels", serverId],
    queryFn: () => mockFetchChannels(serverId),
    enabled: !!serverId,
  });
}

export function useMembers(serverId: number) {
  return useQuery({
    queryKey: ["members", serverId],
    queryFn: () => mockFetchMembers(serverId),
    enabled: !!serverId,
  });
}

export function useCreateServer() {
  return useMutation({
    mutationFn: mockCreateServer,
  });
}
