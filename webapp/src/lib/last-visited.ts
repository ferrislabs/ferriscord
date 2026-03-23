const KEY = 'ferriscord:last_visited'
const GUILD_CHANNEL_KEY = 'ferriscord:last_channel'

export function saveLastVisited(path: string): void {
  localStorage.setItem(KEY, path)
}

export function getLastVisited(): string | null {
  return localStorage.getItem(KEY)
}

export function saveGuildLastChannel(guildId: string, channelId: string): void {
  const map = getGuildChannelMap()
  map[guildId] = channelId
  localStorage.setItem(GUILD_CHANNEL_KEY, JSON.stringify(map))
}

export function getGuildLastChannel(guildId: string): string | null {
  return getGuildChannelMap()[guildId] ?? null
}

function getGuildChannelMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(GUILD_CHANNEL_KEY) ?? '{}')
  } catch {
    return {}
  }
}
