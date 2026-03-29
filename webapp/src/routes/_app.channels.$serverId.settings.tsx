import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { X, Upload, Trash2, Plus } from 'lucide-react'
import { useUserGuilds, useUpdateGuild } from '@/lib/queries/guild-queries'
import {
  useGuildMembers,
  useGuildRoles,
  useCreateRole,
  useDeleteRole,
} from '@/lib/queries/member-queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { Schemas } from '@/api/api.client'
import { usePresenceStore, type PresenceStatus } from '@/stores/presence.store'
import { PresenceIndicator } from '@/components/ui/presence-indicator'

export const Route = createFileRoute('/_app/channels/$serverId/settings')({
  component: GuildSettingsPage,
})

// ─── Banner presets ────────────────────────────────────────────────────────────
const BANNER_PRESETS = [
  '#5865F2',
  '#ED4245',
  '#3BA55C',
  '#FAA61A',
  '#9B59B6',
  '#1ABC9C',
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function colorToCss(color: number): string {
  if (color === 0) return 'hsl(var(--muted-foreground))'
  return `#${color.toString(16).padStart(6, '0')}`
}

// ─── Preview Card ──────────────────────────────────────────────────────────────
interface PreviewCardProps {
  name: string
  iconPreview: string | null
  bannerPreview: string | null // image data URL
  bannerColor: string | null // hex color
  iconUrl: string | null | undefined
  bannerUrl: string | null | undefined
}

function PreviewCard({
  name,
  iconPreview,
  bannerPreview,
  bannerColor,
  iconUrl,
  bannerUrl,
}: PreviewCardProps) {
  const displayIcon = iconPreview ?? iconUrl
  const displayBanner = bannerPreview ?? bannerUrl
  const hasBannerImage = !!displayBanner
  const hasBannerColor = !hasBannerImage && !!bannerColor
  const initial = name ? name[0].toUpperCase() : '?'

  return (
    <div className='w-64 rounded-lg overflow-hidden border border-border bg-card shadow-xl'>
      {/* Banner */}
      {hasBannerImage ? (
        <img
          src={displayBanner!}
          alt='banner'
          className='h-24 w-full object-cover'
        />
      ) : hasBannerColor ? (
        <div
          className='h-24 w-full'
          style={{ backgroundColor: bannerColor! }}
        />
      ) : (
        <div className='h-24 w-full bg-gradient-to-br from-indigo-500 to-purple-600' />
      )}
      {/* Icon */}
      <div className='px-4 -mt-8 pb-4'>
        <div className='ring-4 ring-card rounded-full w-fit mb-2'>
          <Avatar className='h-16 w-16'>
            {displayIcon ? <AvatarImage src={displayIcon} alt={name} /> : null}
            <AvatarFallback className='bg-indigo-500 text-white text-xl font-bold'>
              {initial}
            </AvatarFallback>
          </Avatar>
        </div>
        <p className='font-bold text-foreground'>{name || 'Server Name'}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'members' | 'roles'

function GuildSettingsPage() {
  const { serverId } = Route.useParams()

  const { data: guilds = [] } = useUserGuilds()
  const guild = guilds.find((g) => g.id === serverId) ?? null

  const [tab, setTab] = useState<Tab>('overview')

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleClose() {
    history.back()
  }

  return (
    <div className='fixed inset-0 z-50 flex bg-background'>
      {/* ── Left nav ── */}
      <div className='w-60 shrink-0 flex flex-col items-end bg-sidebar border-r border-sidebar-border py-12 pr-2'>
        <div className='w-44 space-y-0.5'>
          <p className='px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            {guild?.name ?? 'Server'}
          </p>
          <NavItem
            active={tab === 'overview'}
            onClick={() => setTab('overview')}
          >
            Overview
          </NavItem>
          <div className='pt-2'>
            <p className='px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Gestion
            </p>
          </div>
          <NavItem active={tab === 'members'} onClick={() => setTab('members')}>
            Members
          </NavItem>
          <NavItem active={tab === 'roles'} onClick={() => setTab('roles')}>
            Roles
          </NavItem>
        </div>
      </div>

      {/* ── Content ── */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-2xl mx-auto px-8 py-12'>
          {tab === 'overview' && <OverviewTab guild={guild} />}
          {tab === 'members' && <MembersTab guildId={serverId} />}
          {tab === 'roles' && <RolesTab guildId={serverId} />}
        </div>
      </div>

      {/* ── Close button ── */}
      <div className='absolute top-4 right-4'>
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 rounded-full'
          onClick={handleClose}
        >
          <X className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}

function NavItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ guild }: { guild: Schemas.Guild | null }) {
  const { mutate: updateGuild, isPending } = useUpdateGuild()

  const [name, setName] = useState(guild?.name ?? '')
  const [bannerColor, setBannerColor] = useState<string>(
    guild?.banner_color ?? '',
  )
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerMode, setBannerMode] = useState<'color' | 'image'>(
    guild?.banner_url ? 'image' : 'color',
  )

  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Sync when guild loads
  useEffect(() => {
    if (guild) {
      setName(guild.name)
      setBannerColor(guild.banner_color ?? '')
      setBannerMode(guild.banner_url ? 'image' : 'color')
    }
  }, [guild?.id])

  const isDirty =
    name !== (guild?.name ?? '') ||
    bannerColor !== (guild?.banner_color ?? '') ||
    !!iconFile ||
    !!bannerFile

  function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIconFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setIconPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerMode('image')
    const reader = new FileReader()
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!guild) return
    const fd = new FormData()
    if (name !== guild.name) fd.append('name', name)
    if (iconFile) fd.append('icon', iconFile)
    if (bannerFile && bannerMode === 'image') fd.append('banner', bannerFile)
    if (bannerMode === 'color' && bannerColor !== (guild.banner_color ?? ''))
      fd.append('banner_color', bannerColor)

    updateGuild({ path: { guild_id: guild.id }, body: fd } as any, {
      onSuccess: () => toast.success('Server updated'),
      onError: () => toast.error('Failed to update server'),
    })
  }

  function handleReset() {
    setName(guild?.name ?? '')
    setBannerColor(guild?.banner_color ?? '')
    setIconFile(null)
    setIconPreview(null)
    setBannerFile(null)
    setBannerPreview(null)
    setBannerMode(guild?.banner_url ? 'image' : 'color')
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-xl font-bold text-foreground mb-1'>
          Server Overview
        </h1>
        <p className='text-sm text-muted-foreground'>
          Customize the look of your server.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-8'>
        {/* ── Left column: form ── */}
        <div className='space-y-6'>
          {/* Name */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Server Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Icon */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Server Icon
            </label>
            <div
              className='relative w-20 h-20 cursor-pointer group'
              onClick={() => iconInputRef.current?.click()}
            >
              <Avatar className='w-20 h-20'>
                {(iconPreview ?? guild?.icon_url) ? (
                  <AvatarImage
                    src={iconPreview ?? guild?.icon_url ?? undefined}
                    alt={name}
                  />
                ) : null}
                <AvatarFallback className='bg-indigo-500 text-white text-2xl font-bold'>
                  {name[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                <Upload className='h-5 w-5 text-white' />
              </div>
            </div>
            <input
              ref={iconInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleIconChange}
            />
          </div>

          {/* Banner */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Server Banner
            </label>
            <div className='flex gap-2 mb-3'>
              <button
                onClick={() => setBannerMode('color')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md border transition-colors',
                  bannerMode === 'color'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground',
                )}
              >
                Color
              </button>
              <button
                onClick={() => setBannerMode('image')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md border transition-colors',
                  bannerMode === 'image'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground',
                )}
              >
                Image
              </button>
            </div>

            {bannerMode === 'color' && (
              <div className='flex flex-wrap gap-2'>
                {BANNER_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBannerColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all',
                      bannerColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type='color'
                  value={bannerColor || '#5865F2'}
                  onChange={(e) => setBannerColor(e.target.value)}
                  className='h-8 w-8 rounded-full cursor-pointer border-0 p-0 bg-transparent'
                  title='Custom color'
                />
              </div>
            )}

            {bannerMode === 'image' && (
              <div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload className='h-4 w-4 mr-2' />
                  {bannerFile ? bannerFile.name : 'Choose an image'}
                </Button>
                <input
                  ref={bannerInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleBannerChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: preview ── */}
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Preview
          </p>
          <PreviewCard
            name={name}
            iconPreview={iconPreview}
            bannerPreview={bannerMode === 'image' ? bannerPreview : null}
            bannerColor={bannerMode === 'color' ? bannerColor || null : null}
            iconUrl={guild?.icon_url}
            bannerUrl={guild?.banner_url}
          />
        </div>
      </div>

      {/* ── Save bar ── */}
      {isDirty && (
        <div className='fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-3 bg-zinc-900 border-t border-border shadow-lg'>
          <p className='text-sm text-muted-foreground'>Unsaved changes</p>
          <div className='flex gap-2'>
            <Button variant='ghost' size='sm' onClick={handleReset}>
              Reset
            </Button>
            <Button size='sm' onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab({ guildId }: { guildId: string }) {
  const { data: members = [] } = useGuildMembers(guildId)
  const userPresences = usePresenceStore((s) => s.userPresences)

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-xl font-bold text-foreground mb-1'>Members</h1>
        <p className='text-sm text-muted-foreground'>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className='space-y-1'>
        {members.map((member) => {
          const presenceStatus = (userPresences[member.user_id] ??
            (member.status === 'do_not_disturb'
              ? 'dnd'
              : member.status)) as PresenceStatus
          const displayName = member.display_name ?? member.username
          return (
            <div
              key={member.member_id}
              className='flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent'
            >
              <div className='relative shrink-0'>
                <Avatar className='w-9 h-9'>
                  <AvatarImage
                    src={member.avatar_url ?? undefined}
                    alt={member.username}
                  />
                  <AvatarFallback className='bg-indigo-500 text-white text-sm'>
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <PresenceIndicator
                  status={presenceStatus}
                  className='absolute -bottom-0.5 -right-0.5'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>{displayName}</p>
                <p className='text-xs text-muted-foreground truncate'>
                  @{member.username}
                </p>
              </div>
              {member.roles && member.roles.length > 0 && (
                <div className='flex flex-wrap gap-1 justify-end'>
                  {member.roles.slice(0, 3).map((role) => (
                    <span
                      key={role.id}
                      className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border'
                      style={{
                        borderColor: colorToCss(role.color),
                        color: colorToCss(role.color),
                        backgroundColor:
                          role.color !== 0
                            ? `${colorToCss(role.color)}18`
                            : undefined,
                      }}
                    >
                      {role.name}
                    </span>
                  ))}
                  {member.roles.length > 3 && (
                    <span className='text-xs text-muted-foreground'>
                      +{member.roles.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────
function RolesTab({ guildId }: { guildId: string }) {
  const { data: rolesData = { data: [] } } = useGuildRoles(guildId)
  const { mutate: createRole, isPending: isCreating } = useCreateRole(guildId)
  const { mutate: deleteRole } = useDeleteRole(guildId)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#5865F2')

  function handleCreate() {
    if (!newName.trim()) return
    const colorInt = parseInt(newColor.replace('#', ''), 16)
    createRole(
      {
        path: { guild_id: guildId },
        body: { name: newName.trim(), color: colorInt, permissions: 0 },
      } as any,
      {
        onSuccess: () => {
          setNewName('')
          setNewColor('#5865F2')
          setShowCreate(false)
          toast.success('Role created')
        },
        onError: () => toast.error('Failed to create role'),
      },
    )
  }

  function handleDelete(roleId: string) {
    deleteRole({ path: { guild_id: guildId, role_id: roleId } } as any, {
      onSuccess: () => toast.success('Role deleted'),
      onError: () => toast.error('Failed to delete role'),
    })
  }

  const roles = rolesData.data

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-foreground mb-1'>Roles</h1>
          <p className='text-sm text-muted-foreground'>
            {roles.length} role{roles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size='sm' onClick={() => setShowCreate((v) => !v)}>
          <Plus className='h-4 w-4 mr-1' />
          Create Role
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className='border border-border rounded-lg p-4 bg-card space-y-3'>
          <p className='text-sm font-semibold'>New Role</p>
          <div className='flex gap-3'>
            <div className='flex-1'>
              <Input
                placeholder='Role name'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='color'
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className='h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5'
              />
            </div>
            <Button
              size='sm'
              onClick={handleCreate}
              disabled={isCreating || !newName.trim()}
            >
              Create
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className='space-y-1'>
        {roles.map((role) => {
          const colorInt = typeof role.color === 'number' ? role.color : 0
          const css = colorToCss(colorInt)
          return (
            <div
              key={role.id}
              className='flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent group'
            >
              <span
                className='h-3 w-3 rounded-full shrink-0'
                style={{ backgroundColor: css }}
              />
              <span
                className='flex-1 text-sm font-medium'
                style={{ color: colorInt !== 0 ? css : undefined }}
              >
                {role.name}
              </span>
              <button
                onClick={() => handleDelete(role.id as string)}
                className='h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            </div>
          )
        })}
        {roles.length === 0 && (
          <p className='text-sm text-muted-foreground italic px-3'>
            No roles yet.
          </p>
        )}
      </div>
    </div>
  )
}
