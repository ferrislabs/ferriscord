import { useCallback } from "react"

// Simple translation messages
const translations: Record<string, string> = {
  "serverNav.messages": "Messages",
  "serverNav.explore": "Explore",
  "serverNav.more_options": "More Options",
  "serverNav.create_server": "Create Server",
  "serverNav.join_server": "Join Server",
  "serverNav.error_loading_servers": "Error loading servers",
  "serverNav.success_creating_server": "Server created successfully!",
  "serverNav.error_creating_server": "Error creating server",
  "serverNav.modal.title": "Create a New Server",
}

export function useTranslation() {
  const t = useCallback((key: string): string => {
    return translations[key] || key
  }, [])

  return { t }
}
