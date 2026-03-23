import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useGetUser } from '@/lib/queries/user-queries'
import { Skeleton } from '@/components/ui/skeleton'

export interface UserCardInfo {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  bannerUrl?: string | null
}

interface UserProfileCardProps {
  user: UserCardInfo
  anchorRect: DOMRect
  onClose: () => void
}

export function UserProfileCard({ user, anchorRect, onClose }: UserProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { data: fullProfile, isLoading } = useGetUser(user.id)

  // Merge fetched data on top of the seed data passed in
  const displayName = fullProfile?.display_name ?? user.displayName ?? user.username
  const avatarUrl = fullProfile?.avatar_url ?? user.avatarUrl
  const bio = fullProfile?.bio ?? user.bio
  const bannerUrl = fullProfile?.banner_url ?? user.bannerUrl
  const initials = displayName[0].toUpperCase()

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
  const CARD_W = 260

  let left = anchorRect.right + GAP
  if (left + CARD_W > window.innerWidth - 16) {
    left = anchorRect.left - CARD_W - GAP
  }

  const CARD_H = bio ? 230 : 185
  let top = anchorRect.top
  if (top + CARD_H > window.innerHeight - 16) {
    top = window.innerHeight - CARD_H - 16
  }

  return createPortal(
    <div
      ref={cardRef}
      className={cn(
        'fixed z-50 rounded-lg shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden',
        'animate-in fade-in-0 zoom-in-95 duration-150',
      )}
      style={{ left, top, width: CARD_W }}
    >
      {/* Banner */}
      {isLoading ? (
        <Skeleton className='h-20 w-full rounded-none' />
      ) : bannerUrl ? (
        <img src={bannerUrl} alt='banner' className='h-20 w-full object-cover' />
      ) : (
        <div className='h-20 bg-gradient-to-br from-indigo-500 to-purple-600' />
      )}

      {/* Avatar — overlaps banner */}
      <div className='px-4 -mt-8'>
        <div className='ring-4 ring-popover rounded-full w-fit'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className='bg-indigo-500 text-white text-lg font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Info */}
      <div className='px-4 pt-2 pb-4 space-y-1.5'>
        {isLoading ? (
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        ) : (
          <>
            <div>
              <div className='font-semibold text-sm text-foreground leading-tight'>
                {displayName}
              </div>
              <div className='text-xs text-muted-foreground'>
                @{fullProfile?.username ?? user.username}
              </div>
            </div>

            {bio && (
              <div className='border-t border-border pt-2'>
                <p className='text-xs text-muted-foreground leading-relaxed line-clamp-3'>
                  {bio}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
