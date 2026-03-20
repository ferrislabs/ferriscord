export type WsEventType =
  | 'message.new'
  | 'friend_request.received'
  | 'friend_request.accepted'
  | 'pong'

export interface WsEvent {
  type: WsEventType
  room: string
  data: unknown
}

type WsListener = (event: WsEvent) => void

class FerrisWsClient {
  private ws: WebSocket | null = null
  private listeners = new Set<WsListener>()
  private pendingRooms = new Set<string>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private token: string | null = null
  private url: string | null = null

  connect(apiUrl: string, token: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.token === token) return

    this.token = token
    this.url = apiUrl.replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(token)
    this.open()
  }

  private open() {
    if (!this.url) return
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
      // Re-subscribe to all rooms after reconnect
      if (this.pendingRooms.size > 0) {
        this.sendSubscribe([...this.pendingRooms])
      }
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
      // Auto-reconnect after 3 seconds
      this.reconnectTimer = setTimeout(() => this.open(), 3000)
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
  }

  addListener(fn: WsListener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this.token = null
    this.url = null
    this.pendingRooms.clear()
  }

  private sendSubscribe(rooms: string[]) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', rooms }))
  }
}

export const wsClient = new FerrisWsClient()
