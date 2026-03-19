const KEY = 'ferriscord:last_visited'

export function saveLastVisited(path: string): void {
  localStorage.setItem(KEY, path)
}

export function getLastVisited(): string | null {
  return localStorage.getItem(KEY)
}
