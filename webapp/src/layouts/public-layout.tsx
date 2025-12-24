import type { PropsWithChildren } from 'react'

/**
 * PublicLayout - Layout for public/unauthenticated pages
 *
 * This layout is used for pages that don't require authentication,
 * such as landing pages, login pages, error pages, etc.
 *
 * Usage: Wrap this around public routes
 */
export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
