import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { X, Upload, Trash2, Plus, Save } from 'lucide-react'
import { useUserGuilds, useUpdateGuild } from '@/lib/queries/guild-queries'
import {
  useGuildMembers,
  useGuildRoles,
  useAssignRole,
  useCreateRole,
  useDeleteRole,
  useRemoveRole,
  useUpdateRole,
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

const ROLE_PERMISSION_GROUPS: Array<{
  title: string
  permissions: Array<[string, number]>
}> = [
  {
    title: 'General',
    permissions: [
      ['View Server', 2 ** 0],
      ['Manage Server', 2 ** 1],
      ['Manage Roles', 2 ** 2],
      ['Manage Channels', 2 ** 3],
      ['Kick Members', 2 ** 4],
      ['Ban Members', 2 ** 5],
      ['Create Invite', 2 ** 6],
      ['Change Nickname', 2 ** 7],
      ['Manage Nicknames', 2 ** 8],
      ['Manage Emojis', 2 ** 9],
      ['Manage Webhooks', 2 ** 10],
      ['View Audit Log', 2 ** 11],
    ],
  },
  {
    title: 'Text',
    permissions: [
      ['View Channel', 2 ** 12],
      ['Send Messages', 2 ** 13],
      ['Send TTS Messages', 2 ** 14],
      ['Manage Messages', 2 ** 15],
      ['Embed Links', 2 ** 16],
      ['Attach Files', 2 ** 17],
      ['Read Message History', 2 ** 18],
      ['Mention Everyone', 2 ** 19],
      ['Use External Emojis', 2 ** 20],
      ['Add Reactions', 2 ** 21],
      ['Use Slash Commands', 2 ** 22],
      ['Manage Threads', 2 ** 23],
      ['Create Threads', 2 ** 24],
      ['Send Messages In Threads', 2 ** 25],
    ],
  },
  {
    title: 'Voice',
    permissions: [
      ['Connect', 2 ** 26],
      ['Speak', 2 ** 27],
      ['Mute Members', 2 ** 28],
      ['Deafen Members', 2 ** 29],
      ['Move Members', 2 ** 30],
      ['Use Voice Activity', 2 ** 31],
      ['Priority Speaker', 2 ** 32],
      ['Stream', 2 ** 33],
    ],
  },
]

function hasPermission(mask: number, permission: number) {
  return Math.floor(mask / permission) % 2 === 1
}

function togglePermission(mask: number, permission: number) {
  return hasPermission(mask, permission) ? mask - permission : mask + permission
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
type RoleSubTab = 'display' | 'permissions' | 'members'

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
        <div
          className={cn(
            'mx-auto px-8 py-12',
            tab === 'roles' ? 'max-w-[1200px]' : 'max-w-2xl',
          )}
        >
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
function PermissionSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type='button'
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 rounded-full border transition-colors',
        checked
          ? 'border-primary/80 bg-primary'
          : 'border-border bg-background',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[21px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

function RoleEditor({
  role,
  members,
  onDelete,
  onUpdate,
  onAssignMember,
  onRemoveMember,
  isUpdating,
  isAssigning,
  isRemoving,
}: {
  role: Schemas.RoleResponse
  members: Schemas.GuildMemberResponse[]
  onDelete: (roleId: string) => void
  onUpdate: (input: {
    roleId: string
    body: { name: string; color: number; permissions: number }
  }) => void
  onAssignMember: (userId: string, roleId: string) => void
  onRemoveMember: (userId: string, roleId: string) => void
  isUpdating: boolean
  isAssigning: boolean
  isRemoving: boolean
}) {
  const colorInt = typeof role.color === 'number' ? role.color : 0
  const css = colorToCss(colorInt)
  const [draftName, setDraftName] = useState(role.name as string)
  const [draftColor, setDraftColor] = useState(
    `#${colorInt.toString(16).padStart(6, '0')}`,
  )
  const [draftPermissions, setDraftPermissions] = useState(
    (role.permissions as number) ?? 0,
  )
  const [subTab, setSubTab] = useState<RoleSubTab>('permissions')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    setDraftName(role.name as string)
    setDraftColor(`#${colorInt.toString(16).padStart(6, '0')}`)
    setDraftPermissions((role.permissions as number) ?? 0)
    setPermissionSearch('')
    setMemberSearch('')
  }, [role.id, role.name, role.color, role.permissions, colorInt])

  const isEveryone = role.name === '@everyone'
  const roleMembers = isEveryone
    ? members
    : members.filter((member) =>
        member.roles.some((memberRole) => memberRole.id === role.id),
      )
  const filteredMembers = members.filter((member) => {
    const displayName = member.display_name ?? member.username
    const query = memberSearch.trim().toLowerCase()
    if (!query) return true
    return (
      displayName.toLowerCase().includes(query) ||
      member.username.toLowerCase().includes(query)
    )
  })
  const normalizedPermissionSearch = permissionSearch.trim().toLowerCase()
  const visiblePermissionGroups = ROLE_PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter(([label]) =>
      normalizedPermissionSearch
        ? label.toLowerCase().includes(normalizedPermissionSearch)
        : true,
    ),
  })).filter((group) => group.permissions.length > 0)
  const enabledPermissionCount = ROLE_PERMISSION_GROUPS.reduce(
    (count, group) =>
      count +
      group.permissions.filter(([, value]) =>
        hasPermission(draftPermissions, value),
      ).length,
    0,
  )
  const isDirty =
    draftName !== role.name ||
    parseInt(draftColor.replace('#', ''), 16) !== colorInt ||
    draftPermissions !== ((role.permissions as number) ?? 0)

  function handleSave() {
    const name = draftName.trim()
    if (!name) return

    onUpdate({
      roleId: role.id as string,
      body: {
        name,
        color: parseInt(draftColor.replace('#', ''), 16),
        permissions: draftPermissions,
      },
    })
  }

  return (
    <div className='flex min-h-[720px] min-w-0 flex-1 flex-col'>
      <div className='border-b border-border px-6 pt-5'>
        <div className='mb-5 flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
              Edit Role
            </p>
            <h1 className='mt-1 text-xl font-semibold text-foreground'>
              {draftName || role.name}
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={handleSave}
              disabled={!isDirty || isUpdating || !draftName.trim()}
            >
              <Save className='mr-1 h-4 w-4' />
              Save
            </Button>
            {!isEveryone && (
              <button
                onClick={() => onDelete(role.id as string)}
                className='flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            )}
          </div>
        </div>

        <div className='flex gap-6 text-sm'>
          {(
            [
              ['display', 'Display'],
              ['permissions', 'Permissions'],
              ['members', `Manage Members (${roleMembers.length})`],
            ] as Array<[RoleSubTab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type='button'
              onClick={() => setSubTab(value)}
              className={cn(
                'border-b-2 px-1 pb-3 font-medium transition-colors',
                subTab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className='no-scrollbar flex-1 overflow-y-auto px-6 py-6'>
        {subTab === 'display' && (
          <div className='max-w-2xl space-y-6'>
            <div>
              <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                Role Name
              </p>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                disabled={isEveryone}
                className='h-11 max-w-md'
              />
            </div>

            <div>
              <p className='mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                Role Color
              </p>
              <div className='flex items-center gap-3'>
                <span
                  className='h-4 w-4 rounded-full border border-border'
                  style={{ backgroundColor: css }}
                />
                <input
                  type='color'
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                  className='h-11 w-14 cursor-pointer rounded-md border border-border bg-transparent p-1'
                />
                <span className='font-mono text-sm text-muted-foreground'>
                  {draftColor.toUpperCase()}
                </span>
              </div>
            </div>

            <div className='rounded-xl border border-border bg-background/40 p-4'>
              <p className='text-sm font-medium text-foreground'>
                Current summary
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {enabledPermissionCount} permission
                {enabledPermissionCount !== 1 ? 's' : ''} enabled for this role.
              </p>
            </div>
          </div>
        )}

        {subTab === 'permissions' && (
          <div className='max-w-3xl space-y-6'>
            <Input
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              placeholder='Search permissions'
              className='h-11'
            />

            {visiblePermissionGroups.map((group) => (
              <div key={group.title} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-lg font-semibold text-foreground'>
                    {group.title} Permissions
                  </h2>
                  <button
                    type='button'
                    onClick={() =>
                      setDraftPermissions((current) =>
                        group.permissions.reduce((next, [, value]) => {
                          if (!hasPermission(next, value)) return next
                          return togglePermission(next, value)
                        }, current),
                      )
                    }
                    className='text-sm font-medium text-primary hover:text-primary/80'
                  >
                    Clear permissions
                  </button>
                </div>

                <div className='divide-y divide-border rounded-xl border border-border bg-background/20'>
                  {group.permissions.map(([label, value]) => {
                    const checked = hasPermission(draftPermissions, value)
                    return (
                      <div
                        key={label}
                        className='flex items-start justify-between gap-6 px-4 py-4'
                      >
                        <div className='min-w-0'>
                          <p className='text-base font-medium text-foreground'>
                            {label}
                          </p>
                          <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                            Toggle access for{' '}
                            <span className='font-medium'>{draftName}</span>.
                          </p>
                        </div>
                        <PermissionSwitch
                          checked={checked}
                          onChange={() =>
                            setDraftPermissions((current) =>
                              togglePermission(current, value),
                            )
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'members' && (
          <div className='max-w-3xl space-y-5'>
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder='Search members'
              className='h-11'
            />

            <div className='rounded-xl border border-border bg-background/20'>
              {filteredMembers.map((member) => {
                const displayName = member.display_name ?? member.username
                const hasRole =
                  isEveryone ||
                  member.roles.some((memberRole) => memberRole.id === role.id)

                return (
                  <div
                    key={member.member_id}
                    className='flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0'
                  >
                    <div className='flex min-w-0 items-center gap-3'>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage
                          src={member.avatar_url ?? undefined}
                          alt={member.username}
                        />
                        <AvatarFallback className='bg-indigo-500 text-white text-sm'>
                          {displayName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-foreground'>
                          {displayName}
                        </p>
                        <p className='truncate text-xs text-muted-foreground'>
                          @{member.username}
                        </p>
                      </div>
                    </div>
                    {!isEveryone && (
                      <Button
                        size='sm'
                        variant={hasRole ? 'outline' : 'default'}
                        disabled={isAssigning || isRemoving}
                        onClick={() =>
                          hasRole
                            ? onRemoveMember(
                                member.user_id as string,
                                role.id as string,
                              )
                            : onAssignMember(
                                member.user_id as string,
                                role.id as string,
                              )
                        }
                      >
                        {hasRole ? 'Remove' : 'Assign'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RolesTab({ guildId }: { guildId: string }) {
  const { data: rolesData = { data: [] } } = useGuildRoles(guildId)
  const { data: members = [] } = useGuildMembers(guildId)
  const { mutate: assignRole, isPending: isAssigningRole } =
    useAssignRole(guildId)
  const { mutate: removeRole, isPending: isRemovingRole } =
    useRemoveRole(guildId)
  const { mutate: createRole, isPending: isCreating } = useCreateRole(guildId)
  const { mutate: deleteRole } = useDeleteRole(guildId)
  const { mutate: updateRole, isPending: isUpdatingRole } =
    useUpdateRole(guildId)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#5865F2')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    const colorInt = parseInt(newColor.replace('#', ''), 16)
    createRole(
      {
        path: { guild_id: guildId },
        body: { name: newName.trim(), color: colorInt, permissions: 0 },
      } as any,
      {
        onSuccess: (createdRole: unknown) => {
          setNewName('')
          setNewColor('#5865F2')
          setShowCreate(false)
          const nextRoleId = (createdRole as { id?: string } | undefined)?.id
          if (nextRoleId) {
            setSelectedRoleId(nextRoleId)
          }
          toast.success('Role created')
        },
        onError: () => toast.error('Failed to create role'),
      },
    )
  }

  function handleDelete(roleId: string) {
    deleteRole({ path: { guild_id: guildId, role_id: roleId } } as any, {
      onSuccess: () => {
        if (selectedRoleId === roleId) {
          setSelectedRoleId(null)
        }
        toast.success('Role deleted')
      },
      onError: () => toast.error('Failed to delete role'),
    })
  }

  const roles = rolesData.data
  const selectedRole =
    roles.find((role) => (role.id as string) === selectedRoleId) ??
    roles[0] ??
    null

  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId(null)
      return
    }

    if (!selectedRoleId || !roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id as string)
    }
  }, [roles, selectedRoleId])

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
          <Plus className='mr-1 h-4 w-4' />
          Create Role
        </Button>
      </div>

      {showCreate && (
        <div className='rounded-lg border border-border bg-card p-4 space-y-3'>
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

      {selectedRole ? (
        <div className='flex min-h-[720px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm'>
          <div className='w-64 shrink-0 border-r border-border bg-sidebar/40 p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <p className='text-sm font-semibold text-foreground'>Roles</p>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={() => setShowCreate((v) => !v)}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='space-y-1'>
              {roles.map((role) => {
                const colorInt = typeof role.color === 'number' ? role.color : 0
                return (
                  <button
                    key={role.id}
                    type='button'
                    onClick={() => setSelectedRoleId(role.id as string)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      selectedRole.id === role.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    <span
                      className='h-2.5 w-2.5 shrink-0 rounded-full'
                      style={{ backgroundColor: colorToCss(colorInt) }}
                    />
                    <span className='truncate text-sm font-medium'>
                      {role.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <RoleEditor
            role={selectedRole}
            members={members}
            isUpdating={isUpdatingRole}
            isAssigning={isAssigningRole}
            isRemoving={isRemovingRole}
            onDelete={handleDelete}
            onUpdate={(input) =>
              updateRole(input, {
                onSuccess: () => toast.success('Role updated'),
                onError: (error) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Failed to update role',
                  ),
              })
            }
            onAssignMember={(userId, roleId) =>
              assignRole(
                {
                  path: { guild_id: guildId, user_id: userId, role_id: roleId },
                } as any,
                {
                  onSuccess: () => toast.success('Role assigned'),
                  onError: () => toast.error('Failed to assign role'),
                },
              )
            }
            onRemoveMember={(userId, roleId) =>
              removeRole(
                {
                  path: { guild_id: guildId, user_id: userId, role_id: roleId },
                } as any,
                {
                  onSuccess: () => toast.success('Role removed'),
                  onError: () => toast.error('Failed to remove role'),
                },
              )
            }
          />
        </div>
      ) : (
        <p className='px-3 text-sm italic text-muted-foreground'>
          No roles yet.
        </p>
      )}
    </div>
  )
}
