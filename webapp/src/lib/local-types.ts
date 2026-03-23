/**
 * Local type definitions for features not yet in the auto-generated API client.
 * Remove these once the API client is regenerated with the full OpenAPI spec.
 */

export type FriendUser = {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
}

export type Friendship = {
  id: string
  user: FriendUser
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export type DmChannel = {
  id: string
  recipient: FriendUser
  created_at: string
}
