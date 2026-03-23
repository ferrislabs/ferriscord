import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useGetUser } from '@/lib/queries/user-queries'
import { useGuildRoles, useAssignRole, useRemoveRole, useGuildMembers } from '@/lib/queries/member-queries'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, X, Search } from 'lucide-react'
import { toast } from '@/lib/toast'

export type RoleBadge = { id: string; name: string; color: number }

export interface UserCardInfo {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  bannerUrl?: string | null
  /** Set when opened from a guild context to show/manage roles */
  guildId?: string | null
  roles?: Array<RoleBadge>
}

interface UserProfileCardProps {
  user: UserCardInfo
  anchorRect: DOMRect
  onClose: () => void
}

/** Convert an integer color (e.g. 0xFF5733) to a CSS hex string */
function colorToCss(color: number): string {
  if (color === 0) return 'hsl(var(--muted-foreground))'
  return `#${color.toString(16).padStart(6, '0')}`
}

/** Compute card position from anchor rect + estimated height */
function computePos(anchorRect: DOMRect, cardH: number) {
  const GAP = 8
  const CARD_W = 270
  let left = anchorRect.right + GAP
  if (left + CARD_W > window.innerWidth - 16) {
    left = anchorRect.left - CARD_W - GAP
  }
  let top = anchorRect.top
  if (top + cardH > window.innerHeight - 16) {
    top = window.innerHeight - cardH - 16
  }
  if (top < 8) top = 8
  return { left, top }
}

export function UserProfileCard({ user, anchorRect, onClose }: UserProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  // Initialize position with a height estimate so first paint is correct
  const [pos, setPos] = useState(() => computePos(anchorRect, 300))

  const { data: fullProfile, isLoading } = useGetUser(user.id)
  const { data: guildRoles = { data: [] } } = useGuildRoles(user.guildId ?? null)
  const { data: guildMembers = [] } = useGuildMembers(user.guildId ?? null)
  const { mutate: assignRole } = useAssignRole(user.guildId ?? '')
  const { mutate: removeRole } = useRemoveRole(user.guildId ?? '')

  const displayName = fullProfile?.display_name ?? user.displayName ?? user.username
  const avatarUrl = fullProfile?.avatar_url ?? user.avatarUrl
  const bio = fullProfile?.bio ?? user.bio
  const bannerUrl = fullProfile?.banner_url ?? user.bannerUrl
  const initials = displayName[0].toUpperCase()

  // Resolve member roles: prefer explicitly passed roles, fall back to guild members cache
  const memberRoles: Array<RoleBadge> = user.roles
    ?? (guildMembers as any[]).find((m) => String(m.user_id) === user.id)?.roles
    ?? []

  // Local role state for optimistic UI — keeps card in sync without waiting for cache invalidation
  const [localRoles, setLocalRoles] = useState<Array<RoleBadge>>(memberRoles)
  const hasInitializedRoles = useRef(user.roles != null)

  // Sync from members cache once it loads (only if roles weren't explicitly provided)
  useEffect(() => {
    if (hasInitializedRoles.current) return
    if (memberRoles.length > 0) {
      setLocalRoles(memberRoles)
      hasInitializedRoles.current = true
    }
  }, [memberRoles])

  // ── Recompute position after content loads or picker opens/closes ──────────
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const next = computePos(anchorRect, card.offsetHeight)
    setPos((prev) =>
      prev.left === next.left && prev.top === next.top ? prev : next,
    )
  }, [isLoading, bio, pickerOpen, localRoles.length])

  // ── Close on Escape / outside click ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerOpen) { setPickerOpen(false); setSearch('') }
        else onClose()
      }
    }
    const onPointer = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose, pickerOpen])

  // ── Focus search when picker opens ─────────────────────────────────────────
  useEffect(() => {
    if (pickerOpen) setTimeout(() => searchRef.current?.focus(), 0)
    else setSearch('')
  }, [pickerOpen])

  // ── Role actions ────────────────────────────────────────────────────────────
  const handleRemove = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation()
    if (!user.guildId) return
    const role = localRoles.find((r) => r.id === roleId)
    if (!role) return
    setLocalRoles((prev) => prev.filter((r) => r.id !== roleId))
    removeRole(
      { path: { guild_id: user.guildId, user_id: user.id, role_id: roleId } } as any,
      {
        onError: () => {
          setLocalRoles((prev) => [...prev, role])
          toast.error('Impossible de retirer le rôle')
        },
      },
    )
  }

  const handleTogglePicker = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation()
    if (!user.guildId) return
    const hasRole = localRoles.some((r) => r.id === roleId)
    const roleInfo = guildRoles.data.find((r) => (r.id as string) === roleId)

    if (hasRole) {
      const role = localRoles.find((r) => r.id === roleId)!
      setLocalRoles((prev) => prev.filter((r) => r.id !== roleId))
      removeRole(
        { path: { guild_id: user.guildId, user_id: user.id, role_id: roleId } } as any,
        {
          onError: () => {
            setLocalRoles((prev) => [...prev, role])
            toast.error('Impossible de retirer le rôle')
          },
        },
      )
    } else {
      const newRole: RoleBadge = {
        id: roleId,
        name: (roleInfo?.name as string) ?? '',
        color: (roleInfo?.color as number) ?? 0,
      }
      setLocalRoles((prev) => [...prev, newRole])
      assignRole(
        { path: { guild_id: user.guildId, user_id: user.id, role_id: roleId } } as any,
        {
          onError: () => {
            setLocalRoles((prev) => prev.filter((r) => r.id !== roleId))
            toast.error('Impossible d\'ajouter le rôle')
          },
        },
      )
    }
  }

  // ── Filtered roles for picker ───────────────────────────────────────────────
  const filteredRoles = guildRoles.data.filter((r) =>
    (r.name as string).toLowerCase().includes(search.toLowerCase()),
  )

  return createPortal(
    <div
      ref={cardRef}
      className={cn(
        'fixed z-50 rounded-lg shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden',
        'animate-in fade-in-0 zoom-in-95 duration-150',
      )}
      style={{ left: pos.left, top: pos.top, width: 270 }}
    >
      {/* Banner */}
      {isLoading ? (
        <Skeleton className='h-20 w-full rounded-none' />
      ) : bannerUrl ? (
        <img src={bannerUrl} alt='banner' className='h-20 w-full object-cover' />
      ) : (
        <div className='h-20 bg-gradient-to-br from-indigo-500 to-purple-600' />
      )}

      {/* Avatar */}
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
      <div className='px-4 pt-2 pb-4 space-y-2'>
        {isLoading ? (
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        ) : (
          <>
            <div>
              <div className='font-semibold text-sm text-foreground leading-tight'>{displayName}</div>
              <div className='text-xs text-muted-foreground'>@{fullProfile?.username ?? user.username}</div>
            </div>

            {bio && (
              <div className='border-t border-border pt-2'>
                <p className='text-xs text-muted-foreground leading-relaxed line-clamp-3'>{bio}</p>
              </div>
            )}

            {/* ── Roles — only in guild context ── */}
            {user.guildId && (
              <div className='border-t border-border pt-2 space-y-1.5'>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Rôles
                </p>

                {/* Badges + add button */}
                <div className='flex flex-wrap gap-1 items-center'>
                  {localRoles.map((role) => (
                    <span
                      key={role.id}
                      className='group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border'
                      style={{
                        borderColor: colorToCss(role.color),
                        color: colorToCss(role.color),
                        backgroundColor: role.color !== 0 ? `${colorToCss(role.color)}18` : undefined,
                      }}
                    >
                      <span
                        className='h-1.5 w-1.5 rounded-full shrink-0'
                        style={{ backgroundColor: colorToCss(role.color) }}
                      />
                      {role.name}
                      <button
                        onMouseDown={(e) => handleRemove(e, role.id)}
                        className='ml-0.5 -mr-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive'
                        title='Retirer ce rôle'
                      >
                        <X className='h-2.5 w-2.5' />
                      </button>
                    </span>
                  ))}

                  {/* + button */}
                  {guildRoles.data.length > 0 && (
                    <button
                      onMouseDown={(e) => { e.stopPropagation(); setPickerOpen((v) => !v) }}
                      className={cn(
                        'inline-flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground',
                        pickerOpen && 'border-foreground text-foreground bg-accent',
                      )}
                      title='Ajouter un rôle'
                    >
                      <Plus className='h-3 w-3' />
                    </button>
                  )}

                  {localRoles.length === 0 && guildRoles.data.length === 0 && (
                    <p className='text-xs text-muted-foreground italic'>Aucun rôle</p>
                  )}
                </div>

                {/* ── Role picker dropdown ── */}
                {pickerOpen && (
                  <div
                    className='border border-border rounded-md bg-popover shadow-lg overflow-hidden'
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className='flex items-center gap-1.5 px-2 py-1.5 border-b border-border'>
                      <Search className='h-3 w-3 text-muted-foreground shrink-0' />
                      <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Rechercher un rôle…'
                        className='flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground'
                      />
                    </div>

                    <div className='max-h-36 overflow-y-auto'>
                      {filteredRoles.length === 0 ? (
                        <p className='px-3 py-2 text-xs text-muted-foreground italic'>Aucun rôle trouvé</p>
                      ) : (
                        filteredRoles.map((role) => {
                          const assigned = localRoles.some((r) => r.id === (role.id as string))
                          const css = colorToCss(role.color as number)
                          return (
                            <button
                              key={role.id as string}
                              onMouseDown={(e) => handleTogglePicker(e, role.id as string)}
                              className={cn(
                                'flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left',
                                assigned && 'bg-accent/40',
                              )}
                            >
                              <span className='h-2 w-2 rounded-full shrink-0' style={{ backgroundColor: css }} />
                              <span className='flex-1 truncate' style={{ color: (role.color as number) !== 0 ? css : undefined }}>
                                {role.name as string}
                              </span>
                              {assigned && <span className='text-muted-foreground shrink-0'>✓</span>}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
