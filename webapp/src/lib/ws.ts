export type WsEventType =
  | 'message.new'
  | 'message.delete'
  | 'channel.updated'
  | 'typing.update'
  | 'presence.update'
  | 'friend_request.received'
  | 'friend_request.accepted'
  | 'pong'

export interface WsEvent {
  type: WsEventType
  room: string
  data: unknown
}

type WsListener = (event: WsEvent) => void
type ReconnectListener = () => void

const PING_INTERVAL_MS = 30_000
const RECONNECT_DELAY_MS = 3_000

class FerrisWsClient {
  private ws: WebSocket | null = null
  private listeners = new Set<WsListener>()
  private reconnectListeners = new Set<ReconnectListener>()
  private pendingRooms = new Set<string>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private apiUrl: string | null = null
  // Token getter called on every (re)connect so we always use the freshest token.
  private getToken: (() => string | null) | null = null
  private hasConnectedBefore = false
  // The last presence status set by the user. Sent on every (re)connect so the
  // server doesn't reset us to Online after a page refresh or reconnect.
  private desiredPresence: string | null = null

  connect(apiUrl: string, getToken: () => string | null) {
    // If already open and the base URL hasn't changed, nothing to do.
    if (this.ws?.readyState === WebSocket.OPEN && this.apiUrl === apiUrl) return

    this.apiUrl = apiUrl
    this.getToken = getToken
    this.open()
  }

  private open() {
    const token = this.getToken?.()
    // No token available yet — abort; useWsEvents will call connect() again
    // once the auth store has a valid token.
    if (!this.apiUrl || !token) return

    const url =
      this.apiUrl.replace(/^http/, 'ws') +
      '/ws?token=' +
      encodeURIComponent(token)

    this.stopPing()

    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }

    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      // Re-subscribe to all rooms on every (re)connection
      if (this.pendingRooms.size > 0) {
        this.sendSubscribe([...this.pendingRooms])
      }

      // Restore the user's chosen presence status. The server marks every new
      // connection as Online, so we override it immediately if the user had set
      // a different status before this (re)connect.
      if (this.desiredPresence && this.desiredPresence !== 'online') {
        this.ws?.send(
          JSON.stringify({
            type: 'presence.set',
            status: this.desiredPresence,
          }),
        )
      }

      // Notify reconnect listeners so they can refetch stale data
      // (skip the very first connection — only fire on actual reconnects)
      if (this.hasConnectedBefore) {
        this.reconnectListeners.forEach((fn) => fn())
      }
      this.hasConnectedBefore = true

      this.startPing()
    }

    ws.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data)
        this.listeners.forEach((fn) => fn(event))
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      this.stopPing()
      this.reconnectTimer = setTimeout(() => this.open(), RECONNECT_DELAY_MS)
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  subscribe(rooms: string[]) {
    rooms.forEach((r) => this.pendingRooms.add(r))
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(rooms)
    }
  }

  unsubscribe(rooms: string[]) {
    rooms.forEach((r) => this.pendingRooms.delete(r))
    // Tell the server to stop forwarding these rooms so it can clean up tasks
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', rooms }))
    }
  }

  addListener(fn: WsListener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  addReconnectListener(fn: ReconnectListener) {
    this.reconnectListeners.add(fn)
    return () => this.reconnectListeners.delete(fn)
  }

  disconnect() {
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this.apiUrl = null
    this.getToken = null
    this.pendingRooms.clear()
    this.hasConnectedBefore = false
    this.desiredPresence = null
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, PING_INTERVAL_MS)
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  setPresence(status: 'online' | 'idle' | 'dnd' | 'offline') {
    // Always remember the desired status so it survives reconnects.
    this.desiredPresence = status
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'presence.set', status }))
    }
  }

  setTyping(room: string, isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({ type: 'typing.update', room, is_typing: isTyping }),
      )
    }
  }

  private sendSubscribe(rooms: string[]) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', rooms }))
  }
}

export const wsClient = new FerrisWsClient()
