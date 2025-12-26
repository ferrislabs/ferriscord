export interface Server {
  id: number
  name: string
  description: string
  picture_url: string | null
  banner_url: string | null
  visibility: "Public" | "Private"
  created_at?: string
  updated_at?: string
  member_count?: number
}

export interface Channel {
  id: number
  server_id: number
  name: string
  description?: string
  type: "text" | "voice" | "announcement"
  position?: number
  created_at?: string
}

export interface ServerMember {
  id: number
  server_id: number
  user_id: number
  username: string
  avatar_url?: string
  role: "owner" | "admin" | "member"
  joined_at?: string
}

export interface CreateServerInput {
  name: string
  description: string
  picture_url?: string
  banner_url?: string
  visibility: "Public" | "Private"
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  page_size: number
  total: number
  has_more: boolean
}
