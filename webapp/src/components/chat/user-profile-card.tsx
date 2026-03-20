import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface UserCardInfo {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
}

interface UserProfileCardProps {
  user: UserCardInfo
  anchorRect: DOMRect
  onClose: () => void
}

export function UserProfileCard({ user, anchorRect, onClose }: UserProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onPointer = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onPointer)
    }
  }, [onClose])

  // Position: prefer right of anchor, flip left if too close to viewport edge
  const GAP = 8
  const CARD_W = 240

  let left = anchorRect.right + GAP
  if (left + CARD_W > window.innerWidth - 16) {
    left = anchorRect.left - CARD_W - GAP
  }

  let top = anchorRect.top
  // Clamp vertically so card doesn't go off screen bottom (estimated height ~160px)
  const CARD_H = 160
  if (top + CARD_H > window.innerHeight - 16) {
    top = window.innerHeight - CARD_H - 16
  }

  const displayName = user.displayName ?? user.username
  const initials = displayName[0].toUpperCase()

  return createPortal(
    <div
      ref={cardRef}
      className={cn(
        'fixed z-50 w-60 rounded-lg shadow-xl border border-border bg-popover text-popover-foreground',
        'animate-in fade-in-0 zoom-in-95 duration-150',
      )}
      style={{ left, top }}
    >
      {/* Banner */}
      <div className='h-16 rounded-t-lg bg-gradient-to-br from-indigo-500 to-purple-600' />

      {/* Avatar — overlaps banner */}
      <div className='px-4 -mt-8'>
        <div className='ring-4 ring-popover rounded-full w-fit'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className='bg-indigo-500 text-white text-lg font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Info */}
      <div className='px-4 pt-2 pb-4 space-y-0.5'>
        <div className='font-semibold text-sm text-foreground leading-tight'>
          {displayName}
        </div>
        {user.displayName && (
          <div className='text-xs text-muted-foreground'>
            @{user.username}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
