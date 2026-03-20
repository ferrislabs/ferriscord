export type WsEventType =
  | 'message.new'
  | 'message.delete'
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
  private token: string | null = null
  private url: string | null = null
  private hasConnectedBefore = false

  connect(apiUrl: string, token: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.token === token) return

    this.token = token
    this.url = apiUrl.replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(token)
    this.open()
  }

  private open() {
    if (!this.url) return

    this.stopPing()

    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }

    const ws = new WebSocket(this.url)
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
    this.token = null
    this.url = null
    this.pendingRooms.clear()
    this.hasConnectedBefore = false
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

  private sendSubscribe(rooms: string[]) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', rooms }))
  }
}

export const wsClient = new FerrisWsClient()
