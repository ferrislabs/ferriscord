import {
  Hash,
  Volume2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  FolderOpen,
  Copy,
  Shield,
} from 'lucide-react'
import {
  Link,
  useParams,
  useNavigate,
  useMatchRoute,
} from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import {
  useGuildChannels,
  useCreateChannel,
  useUpdateChannel,
} from '@/lib/queries/channel-queries'
import { useUserGuilds, useLeaveGuild } from '@/lib/queries/guild-queries'
import { useOidcUser } from '@axa-fr/react-oidc'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'
import { useMobile } from '@/hooks/use-mobile'
import { useSidebar } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect, useMemo } from 'react'
import { toast } from '@/lib/toast'
import type { Schemas } from '@/api/api.client'
import { UserProfileSummary } from '@/components/chat/user-profile-card'
import { useGetMe } from '@/lib/queries/user-queries'
import { useListDms } from '@/lib/queries/dm-queries'
import { InviteModal } from '@/components/guild/invite-modal'
import { usePresenceStore } from '@/stores/presence.store'
import { PresenceIndicator } from '@/components/ui/presence-indicator'
import { useNotificationStore } from '@/stores/notification.store'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'

type ChannelKind = 'Text' | 'Voice' | 'Category'

// ─── CreateChannelDialog ──────────────────────────────────────────────────────

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guildId: string
  categories: Schemas.Channel[]
  defaultKind?: ChannelKind
  defaultCategoryId?: string | null
}

function CreateChannelDialog({
  open,
  onOpenChange,
  guildId,
  categories,
  defaultKind = 'Text',
  defaultCategoryId = null,
}: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ChannelKind>(defaultKind)
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId)

  useEffect(() => {
    if (open) {
      setKind(defaultKind)
      setName('')
      setCategoryId(defaultCategoryId)
    }
  }, [open, defaultKind, defaultCategoryId])

  const { mutateAsync: createChannel, isPending } = useCreateChannel()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createChannel({
        path: { guild_id: guildId },
        body: {
          name: name.trim(),
          kind,
          parent_id: kind !== 'Category' && categoryId ? categoryId : undefined,
        },
      })
      toast.success(
        kind === 'Category'
          ? `Category "${name.trim()}" created`
          : `#${name.trim()} created`,
      )
      onOpenChange(false)
    } catch {
      toast.error('Failed to create channel')
    }
  }

  const kindOptions: {
    value: ChannelKind
    icon: React.ReactNode
    label: string
    description: string
  }[] = [
    {
      value: 'Text',
      icon: <Hash className='h-5 w-5 shrink-0' />,
      label: 'Text',
      description: 'Messages, links, files',
    },
    {
      value: 'Voice',
      icon: <Volume2 className='h-5 w-5 shrink-0' />,
      label: 'Voice',
      description: 'Voice call',
    },
    {
      value: 'Category',
      icon: <FolderOpen className='h-5 w-5 shrink-0' />,
      label: 'Category',
      description: 'Group of channels',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-5'>
          <div className='grid grid-cols-3 gap-2'>
            {kindOptions.map((opt) => (
              <button
                key={opt.value}
                type='button'
                onClick={() => setKind(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all duration-150',
                  kind === opt.value
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/70',
                )}
              >
                {opt.icon}
                <div>
                  <div className='text-sm font-medium'>{opt.label}</div>
                  <div className='text-xs opacity-60 mt-0.5 hidden sm:block'>
                    {opt.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
              {kind === 'Category' ? 'Category Name' : 'Channel Name'}
            </label>
            <div className='relative'>
              <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60'>
                {kind === 'Text' ? (
                  <Hash className='h-4 w-4' />
                ) : kind === 'Voice' ? (
                  <Volume2 className='h-4 w-4' />
                ) : (
                  <FolderOpen className='h-4 w-4' />
                )}
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  kind === 'Category' ? 'new-category' : 'new-channel'
                }
                className='pl-9'
                disabled={isPending}
                autoFocus
                maxLength={100}
              />
            </div>
          </div>

          {kind !== 'Category' && categories.length > 0 && (
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
                Category (optional)
              </label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                disabled={isPending}
              >
                <option value=''>No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='flex justify-end gap-2 pt-1'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !name.trim()}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── DnD helpers ─────────────────────────────────────────────────────────────

type ContainerMap = Record<string, string[]>
const EMPTY_CHANNELS: Schemas.Channel[] = []
const EMPTY_DMS: Schemas.DmChannel[] = []

function buildContainerMap(channels: Schemas.Channel[]): ContainerMap {
  const map: ContainerMap = { uncategorized: [], __categories__: [] }
  for (const ch of channels
    .filter((c) => c.kind === 'Category')
    .sort((a, b) => a.position - b.position)) {
    map.__categories__.push(ch.id)
    map[ch.id] = []
  }
  const nonCats = channels
    .filter((ch) => ch.kind !== 'Category')
    .sort((a, b) => a.position - b.position)
  for (const ch of nonCats) {
    const container = ch.parent_id ?? 'uncategorized'
    if (!map[container]) map[container] = []
    map[container].push(ch.id)
  }
  return map
}

function findContainerOf(id: string, order: ContainerMap): string | null {
  if (id in order) return id
  for (const [containerId, items] of Object.entries(order)) {
    if (items.includes(id)) return containerId
  }
  return null
}

function isSameContainerMap(a: ContainerMap, b: ContainerMap): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    const aItems = a[key] ?? []
    const bItems = b[key] ?? []
    if (aItems.length !== bItems.length) return false
    for (let i = 0; i < aItems.length; i += 1) {
      if (aItems[i] !== bItems[i]) return false
    }
  }

  return true
}

// ─── Sortable channel item ────────────────────────────────────────────────────

interface SortableChannelItemProps {
  channel: Schemas.Channel
  serverId: string
  channelId: string | undefined
  onChannelClick?: () => void
  isDragOverlay?: boolean
  onCopyChannelId?: (channel: Schemas.Channel) => void
  onCreateClick?: (categoryId: string | null) => void
  onInviteClick?: () => void
  onOpenServerSettings?: () => void
  canManageServer?: boolean
  canLeaveGuild?: boolean
  onLeaveGuild?: () => void
  onOpenPermissions?: (channel: Schemas.Channel) => void
}

function SortableChannelItem({
  channel,
  serverId,
  channelId,
  onChannelClick,
  isDragOverlay,
  onCopyChannelId,
  onCreateClick,
  onInviteClick,
  onOpenServerSettings,
  canManageServer,
  canLeaveGuild,
  onLeaveGuild,
  onOpenPermissions,
}: SortableChannelItemProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = channel.kind === 'Voice' ? Volume2 : Hash

  const handleClick = () => {
    navigate({
      to: '/channels/$serverId/$channelId',
      params: { serverId, channelId: channel.id },
    })
    onChannelClick?.()
  }

  const item = (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      className={cn(
        'flex items-center space-x-2 py-1.5 px-2 mx-1 rounded transition-colors select-none',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay
          ? 'shadow-lg opacity-95 cursor-grabbing'
          : 'cursor-pointer',
        channelId === channel.id
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
      onClick={isDragOverlay ? undefined : handleClick}
    >
      <Icon className='h-4 w-4 shrink-0' />
      <span className='text-sm font-medium truncate'>{channel.name}</span>
    </div>
  )

  if (isDragOverlay) return item

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{item}</ContextMenuTrigger>
      <ContextMenuContent className='w-56'>
        <ContextMenuLabel className='truncate'>
          {channel.kind === 'Voice' ? 'Voice Channel' : 'Text Channel'} •{' '}
          {channel.name}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleClick}>Open channel</ContextMenuItem>
        {onCreateClick && (
          <ContextMenuItem
            onSelect={() => onCreateClick(channel.parent_id ?? null)}
          >
            Create channel
          </ContextMenuItem>
        )}
        {onInviteClick && (
          <ContextMenuItem onSelect={onInviteClick}>
            Invite people
          </ContextMenuItem>
        )}
        {onOpenPermissions && channel.kind !== 'Voice' && (
          <ContextMenuItem onSelect={() => onOpenPermissions(channel)}>
            <Shield className='mr-2 h-4 w-4' />
            Permissions
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => onCopyChannelId?.(channel)}>
          <Copy className='mr-2 h-4 w-4' />
          Copy channel ID
        </ContextMenuItem>
        {(canManageServer || canLeaveGuild) && <ContextMenuSeparator />}
        {canManageServer && onOpenServerSettings && (
          <ContextMenuItem onSelect={onOpenServerSettings}>
            Server Settings
          </ContextMenuItem>
        )}
        {canLeaveGuild && onLeaveGuild && (
          <ContextMenuItem
            className='text-destructive focus:text-destructive'
            onSelect={onLeaveGuild}
          >
            Leave Server
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ─── Sortable category ────────────────────────────────────────────────────────

interface SortableCategoryProps {
  category: Schemas.Channel
  items: string[]
  channelMap: Record<string, Schemas.Channel>
  serverId: string
  channelId: string | undefined
  collapsed: boolean
  onToggle: () => void
  onCreateClick: () => void
  onChannelClick?: () => void
  isChannelOver?: boolean
  onCopyCategoryId?: (category: Schemas.Channel) => void
  onCopyChannelId?: (channel: Schemas.Channel) => void
  onOpenPermissions?: (channel: Schemas.Channel) => void
  onEditCategory?: (category: Schemas.Channel) => void
  onDeleteCategory?: (category: Schemas.Channel) => void
}

function SortableCategory({
  category,
  items,
  channelMap,
  serverId,
  channelId,
  collapsed,
  onToggle,
  onCreateClick,
  onChannelClick,
  isChannelOver,
  onCopyCategoryId,
  onCopyChannelId,
  onOpenPermissions,
  onEditCategory,
  onDeleteCategory,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('mb-1', isDragging && 'opacity-40')}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'group/cat flex items-center px-1 py-1 rounded transition-colors select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-pointer',
              isChannelOver && 'bg-accent/20',
            )}
            onClick={onToggle}
          >
            <div className='flex items-center gap-1 min-w-0 flex-1'>
              {collapsed ? (
                <ChevronRight className='h-3 w-3 shrink-0 text-muted-foreground' />
              ) : (
                <ChevronDown className='h-3 w-3 shrink-0 text-muted-foreground' />
              )}
              <span className='text-xs font-semibold text-muted-foreground uppercase truncate'>
                {category.name}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateClick()
              }}
              className='opacity-0 group-hover/cat:opacity-100 transition-opacity rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 shrink-0'
              title='Create a channel in this category'
            >
              <Plus className='h-3.5 w-3.5' />
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className='w-56'>
          <ContextMenuLabel className='truncate'>
            Category • {category.name}
          </ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={onToggle}>
            {collapsed ? 'Expand category' : 'Collapse category'}
          </ContextMenuItem>
          <ContextMenuItem onSelect={onCreateClick}>
            Create channel in category
          </ContextMenuItem>
          {onOpenPermissions && (
            <ContextMenuItem onSelect={() => onOpenPermissions(category)}>
              <Shield className='mr-2 h-4 w-4' />
              Permissions
            </ContextMenuItem>
          )}
          {onEditCategory && (
            <ContextMenuItem onSelect={() => onEditCategory(category)}>
              Edit Category
            </ContextMenuItem>
          )}
          {onDeleteCategory && (
            <ContextMenuItem
              className='text-destructive focus:text-destructive'
              onSelect={() => onDeleteCategory(category)}
            >
              Delete Category
            </ContextMenuItem>
          )}
          <ContextMenuItem onSelect={() => onCopyCategoryId?.(category)}>
            <Copy className='mr-2 h-4 w-4' />
            Copy category ID
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {!collapsed && (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((id) => {
            const ch = channelMap[id]
            if (!ch) return null
            return (
              <SortableChannelItem
                key={id}
                channel={ch}
                serverId={serverId}
                channelId={channelId}
                onChannelClick={onChannelClick}
                onCopyChannelId={onCopyChannelId}
                onCreateClick={() => onCreateClick()}
                onOpenPermissions={onOpenPermissions}
              />
            )
          })}
        </SortableContext>
      )}
    </div>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
  const queryClient = useQueryClient()
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { user, signOut } = useAuth()
  const { oidcUser } = useOidcUser()
  const { data: profile } = useGetMe()
  const isMobile = useMobile()
  const { setCollapsed } = useSidebar()
  const closeSidebarOnMobile = () => {
    if (isMobile) setCollapsed(true)
  }
  const myStatus = usePresenceStore((s) => s.myStatus)

  const [guildMenuOpen, setGuildMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogDefaultKind, setCreateDialogDefaultKind] =
    useState<ChannelKind>('Text')
  const [createDialogDefaultCategoryId, setCreateDialogDefaultCategoryId] =
    useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem('ferriscord:collapsed_categories') ?? '{}',
      )
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(
      'ferriscord:collapsed_categories',
      JSON.stringify(collapsedCategories),
    )
  }, [collapsedCategories])

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // ─── DnD state ───────────────────────────────────────────────────────────

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [localOrder, setLocalOrder] = useState<ContainerMap>({})

  const isDMRoute =
    matchRoute({ to: '/channels/@me' }) ||
    matchRoute({ to: '/channels/@me/$channelId' })

  const serverId = params.serverId ?? null
  const channelId = params.channelId
  const dmChannelId = isDMRoute ? channelId : undefined

  const { data: dmsData } = useListDms()
  const { data: guilds } = useUserGuilds()
  const guild = guilds?.find((g) => g.id === serverId)

  const { data: channelsData, isLoading: isLoadingChannels } =
    useGuildChannels(serverId)
  const { mutate: updateChannel } = useUpdateChannel()
  const dms = dmsData ?? EMPTY_DMS
  const channels = channelsData ?? EMPTY_CHANNELS
  const dmUnreadCounts = useNotificationStore((s) => s.dmUnreadCounts)
  const totalUnreadDms = Object.values(dmUnreadCounts).reduce(
    (sum, count) => sum + count,
    0,
  )

  const categories = useMemo(
    () =>
      channels
        .filter((ch) => ch.kind === 'Category')
        .sort((a, b) => a.position - b.position),
    [channels],
  )

  const channelMap = useMemo(
    () => Object.fromEntries(channels.map((ch) => [ch.id, ch])),
    [channels],
  )

  // Sync localOrder from server data when not dragging
  useEffect(() => {
    if (!activeId) {
      const nextOrder = buildContainerMap(channels)
      setLocalOrder((prev) =>
        isSameContainerMap(prev, nextOrder) ? prev : nextOrder,
      )
    }
  }, [channels, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return

    // ── Category reordering ──────────────────────────────────────────────────
    const isCategoryDrag = (localOrder['__categories__'] ?? []).includes(
      active.id as string,
    )
    if (isCategoryDrag) {
      const cats = [...(localOrder['__categories__'] ?? [])]
      if (!cats.includes(over.id as string)) return
      const oldIdx = cats.indexOf(active.id as string)
      const newIdx = cats.indexOf(over.id as string)
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        setLocalOrder((prev) => ({
          ...prev,
          __categories__: arrayMove(cats, oldIdx, newIdx),
        }))
      }
      return
    }

    // ── Channel cross-container move ─────────────────────────────────────────
    const activeContainer = findContainerOf(active.id as string, localOrder)
    const overContainer = findContainerOf(over.id as string, localOrder)

    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return

    // Auto-expand collapsed category on hover
    if (
      overContainer !== 'uncategorized' &&
      overContainer !== '__categories__' &&
      collapsedCategories[overContainer]
    ) {
      setCollapsedCategories((prev) => ({ ...prev, [overContainer]: false }))
    }

    setLocalOrder((prev) => {
      const next: ContainerMap = {}
      for (const [k, v] of Object.entries(prev)) next[k] = [...v]

      next[activeContainer] = next[activeContainer].filter(
        (id) => id !== active.id,
      )

      const overIndex = next[overContainer].indexOf(over.id as string)
      if (overIndex >= 0) {
        next[overContainer].splice(overIndex, 0, active.id as string)
      } else {
        next[overContainer].push(active.id as string)
      }

      return next
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)

    if (!over) {
      setLocalOrder(buildContainerMap(channels))
      return
    }
    if (!serverId) return

    // ── Category reordering ──────────────────────────────────────────────────
    const isCategoryDrag = (localOrder['__categories__'] ?? []).includes(
      active.id as string,
    )
    if (isCategoryDrag) {
      const originalOrder = buildContainerMap(channels)
      const origCats = originalOrder['__categories__'] ?? []
      ;(localOrder['__categories__'] ?? []).forEach((id, index) => {
        if (origCats.indexOf(id) !== index) {
          updateChannel({
            path: { guild_id: serverId, channel_id: id },
            body: { parent_id: null, position: index },
          })
        }
      })
      return
    }

    // ── Channel same-container reordering ────────────────────────────────────
    const activeContainer = findContainerOf(active.id as string, localOrder)
    const overContainer = findContainerOf(over.id as string, localOrder)

    let finalOrder = localOrder

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const items = [...localOrder[activeContainer]]
      const oldIdx = items.indexOf(active.id as string)
      const newIdx = items.indexOf(over.id as string)
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        const reordered = arrayMove(items, oldIdx, newIdx)
        finalOrder = { ...localOrder, [activeContainer]: reordered }
        setLocalOrder(finalOrder)
      }
    }

    // ── Channel API updates ──────────────────────────────────────────────────
    const originalOrder = buildContainerMap(channels)

    for (const [containerId, ids] of Object.entries(finalOrder)) {
      if (containerId === '__categories__') continue
      if (!(containerId in originalOrder) && containerId !== 'uncategorized')
        continue
      const newParentId = containerId === 'uncategorized' ? null : containerId

      ids.forEach((id, index) => {
        const origContainerId = findContainerOf(id, originalOrder)
        if (!origContainerId) return
        const origIndex = originalOrder[origContainerId].indexOf(id)
        const origParentId =
          origContainerId === 'uncategorized' ? null : origContainerId

        if (origParentId !== newParentId || origIndex !== index) {
          updateChannel({
            path: { guild_id: serverId, channel_id: id },
            body: { parent_id: newParentId, position: index },
          })
        }
      })
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  const { mutate: leaveGuild, isPending: isLeaving } = useLeaveGuild()

  const openCreateDialog = (
    kind: ChannelKind,
    categoryId: string | null = null,
  ) => {
    setCreateDialogDefaultKind(kind)
    setCreateDialogDefaultCategoryId(categoryId)
    setCreateDialogOpen(true)
  }

  const handleLeaveGuild = () => {
    if (!serverId) return
    leaveGuild(
      { path: { guild_id: serverId } },
      {
        onSuccess: () => {
          toast.success('You left the server')
          navigate({ to: '/channels/@me' })
        },
        onError: () => {
          toast.error('Failed to leave server')
        },
      },
    )
  }

  const handleCopyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  const openServerSettings = () => {
    if (!serverId) return
    navigate({ to: '/channels/$serverId/settings', params: { serverId } })
  }

  const openPermissionsDialog = (channel: Schemas.Channel) => {
    if (!serverId) return
    navigate({
      to: '/channels/$serverId/channel-settings/$channelId',
      params: { serverId, channelId: channel.id },
      search: { tab: 'permissions' },
    })
  }

  const openCategorySettings = (channel: Schemas.Channel) => {
    if (!serverId) return
    navigate({
      to: '/channels/$serverId/channel-settings/$channelId',
      params: { serverId, channelId: channel.id },
      search: { tab: 'overview' },
    })
  }

  const handleDeleteCategory = async (channel: Schemas.Channel) => {
    if (!serverId) return

    try {
      const accessToken = useAuthStore.getState().accessToken
      const response = await fetch(
        `${window.apiUrl}/guilds/${serverId}/channels/${channel.id}`,
        {
          method: 'DELETE',
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
          credentials: 'include',
        },
      )

      if (!response.ok) throw new Error()

      await queryClient.invalidateQueries({
        queryKey: [{ _id: '/guilds/{guild_id}/channels' }],
      })
      toast.success('Category deleted')
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const handleCopyUserId = () => {
    if (!profile?.id) return
    void handleCopyToClipboard(profile.id, 'User ID')
  }

  const handleUpdateActivity = () => {
    toast('Update Activity is coming soon')
  }

  const openUserSettings = () => {
    setUserMenuOpen(false)
    requestAnimationFrame(() => {
      navigate({ to: '/settings' })
    })
  }

  const oidcSub =
    typeof oidcUser === 'object' &&
    oidcUser !== null &&
    'sub' in oidcUser &&
    typeof oidcUser.sub === 'string'
      ? oidcUser.sub
      : null

  const isGuildOwner = !!guild && guild.owner_id === oidcSub

  const { setNodeRef: uncategorizedRef, isOver: uncategorizedIsOver } =
    useDroppable({ id: 'uncategorized' })

  const userFooterMenu = (
    <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button className='flex min-w-0 flex-1 items-center space-x-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-accent/50'>
          <div className='relative shrink-0'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={profile?.avatar_url ?? user?.avatar}
                alt={profile?.display_name ?? user?.preferred_username}
              />
              <AvatarFallback className='bg-primary text-primary-foreground text-xs'>
                {(profile?.display_name ??
                  user?.preferred_username)?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <PresenceIndicator
              status={myStatus}
              className='absolute -bottom-0.5 -right-0.5'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='truncate text-sm font-medium text-foreground'>
              {profile?.display_name ??
                user?.preferred_username ??
                'Unknown User'}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        side='top'
        className='w-[300px] overflow-hidden p-0'
      >
        <div>
          <UserProfileSummary
            displayName={
              profile?.display_name ??
              profile?.username ??
              user?.preferred_username ??
              'Unknown User'
            }
            username={
              profile?.username ?? user?.preferred_username ?? 'unknown'
            }
            avatarUrl={profile?.avatar_url ?? user?.avatar}
            bio={profile?.bio}
            bannerUrl={profile?.banner_url}
            className='rounded-none border-0 bg-transparent shadow-none'
          />
        </div>
        <div className='px-1 pb-1'>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              openUserSettings()
            }}
          >
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleUpdateActivity}>
            Update Activity
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyUserId}>
            <Copy className='mr-2 h-4 w-4' />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onSelect={handleLogout}
          >
            <LogOut className='mr-2 h-4 w-4' />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // ─── DM Sidebar ──────────────────────────────────────────────────────────

  if (isDMRoute) {
    return (
      <>
        <Sidebar>
          <SidebarHeader>
            <div className='flex items-center justify-between px-2 h-8'>
              <span className='font-semibold text-foreground'>
                Direct Messages
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className='flex-1 h-full'>
              <div className='space-y-0.5 p-2'>
                <Link to='/channels/@me'>
                  <div
                    className={cn(
                      'flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                      !dmChannelId
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )}
                  >
                    <Users className='h-5 w-5 shrink-0' />
                    <span className='text-sm font-medium'>Friends</span>
                    {totalUnreadDms > 0 && (
                      <span className='ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm'>
                        {totalUnreadDms > 99 ? '99+' : totalUnreadDms}
                      </span>
                    )}
                  </div>
                </Link>
                <div className='pt-4 pb-2'>
                  <div className='px-2 text-xs font-semibold text-muted-foreground uppercase'>
                    Direct Messages
                  </div>
                </div>
                {dms.map((dm) => {
                  const displayName =
                    dm.recipient.display_name ?? dm.recipient.username
                  const unreadCount = dmUnreadCounts[dm.id] ?? 0
                  return (
                    <Link
                      key={dm.id}
                      to='/channels/@me/$channelId'
                      params={{ channelId: dm.id }}
                      onClick={closeSidebarOnMobile}
                    >
                      <div
                        className={cn(
                          'flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                          dmChannelId === dm.id
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                        )}
                      >
                        <Avatar className='h-7 w-7'>
                          <AvatarImage
                            src={dm.recipient.avatar_url ?? undefined}
                            alt={displayName}
                          />
                          <AvatarFallback className='text-xs'>
                            {displayName[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm truncate'>{displayName}</span>
                        {unreadCount > 0 && (
                          <span className='ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm'>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter>
            <div className='flex items-center space-x-2'>{userFooterMenu}</div>
          </SidebarFooter>
        </Sidebar>
      </>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoadingChannels) {
    return (
      <Sidebar>
        <SidebarHeader>
          <div className='px-2 h-12 flex items-center'>
            <Skeleton className='h-5 w-32' />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className='space-y-0.5 p-2'>
            <div className='px-2 py-1.5'>
              <Skeleton className='h-3 w-24' />
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-center space-x-2 px-2 py-1.5 mx-1'
              >
                <Skeleton className='h-4 w-4 shrink-0' />
                <Skeleton className='h-4 flex-1' />
              </div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  // ─── Server Sidebar ───────────────────────────────────────────────────────

  const isCategoryDragging = activeId
    ? (localOrder['__categories__'] ?? []).includes(activeId as string)
    : false
  const activeChannel =
    activeId && !isCategoryDragging ? channelMap[activeId as string] : null
  const activeCategoryItem =
    activeId && isCategoryDragging ? channelMap[activeId as string] : null
  // Display categories in localOrder order (updates during drag)
  const sortedCategories = (localOrder['__categories__'] ?? [])
    .map((id) => channelMap[id])
    .filter((c): c is Schemas.Channel => !!c)

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <DropdownMenu onOpenChange={(open) => setGuildMenuOpen(open)}>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='relative h-16 w-full justify-between overflow-hidden px-2 hover:bg-accent gap-2'
              >
                {guild?.banner_url ? (
                  <>
                    <img
                      src={guild.banner_url}
                      alt={`${guild.name} banner`}
                      className='absolute inset-0 h-full w-full object-cover'
                    />
                    <div className='absolute inset-0 bg-black/45' />
                  </>
                ) : (
                  <div className='absolute inset-0 bg-gradient-to-r from-primary/12 to-transparent' />
                )}
                <div className='relative z-10 flex items-center gap-2 min-w-0'>
                  {guild?.icon_url ? (
                    <img
                      src={guild.icon_url}
                      alt={guild.name}
                      className='h-6 w-6 rounded-full object-contain shrink-0 ring-2 ring-black/25 bg-black/30 p-0.5'
                    />
                  ) : (
                    <div className='h-6 w-6 rounded-full bg-black/35 flex items-center justify-center shrink-0 ring-2 ring-black/20'>
                      <span className='text-xs font-bold text-primary'>
                        {guild?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span
                    className={cn(
                      'font-semibold truncate',
                      guild?.banner_url ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {guild?.name ?? '—'}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'relative z-10 h-4 w-4 shrink-0 transition-transform duration-200',
                    guild?.banner_url
                      ? 'text-white/85'
                      : 'text-muted-foreground',
                    guildMenuOpen && 'rotate-180',
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-56'>
              <DropdownMenuItem onSelect={() => openCreateDialog('Text')}>
                <Plus className='h-4 w-4 mr-2' />
                Create channel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openCreateDialog('Category')}>
                <FolderOpen className='h-4 w-4 mr-2' />
                Create category
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setInviteModalOpen(true)}>
                <Users className='h-4 w-4 mr-2' />
                Invite people
              </DropdownMenuItem>
              {isGuildOwner && (
                <DropdownMenuItem
                  onSelect={() =>
                    navigate({
                      to: '/channels/$serverId/settings',
                      params: { serverId: serverId! },
                    })
                  }
                >
                  <Settings className='h-4 w-4 mr-2' />
                  Server Settings
                </DropdownMenuItem>
              )}
              {!isGuildOwner && (
                <DropdownMenuItem
                  className='text-destructive'
                  onSelect={handleLeaveGuild}
                  disabled={isLeaving}
                >
                  Leave Server
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className='flex-1 h-full'>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className='min-h-full pt-2 pb-2'>
                  {channels.length === 0 ? (
                    <div className='px-4 py-6 text-center'>
                      <p className='text-sm text-muted-foreground mb-3'>
                        No channels yet
                      </p>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => openCreateDialog('Text')}
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Create channel
                      </Button>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                    >
                      <div
                        ref={uncategorizedRef}
                        className={cn(
                          'transition-colors',
                          uncategorizedIsOver && 'bg-accent/10 rounded',
                        )}
                      >
                        <SortableContext
                          items={localOrder['uncategorized'] ?? []}
                          strategy={verticalListSortingStrategy}
                        >
                          {(localOrder['uncategorized'] ?? []).map((id) => {
                            const ch = channelMap[id]
                            if (!ch) return null
                            return (
                              <SortableChannelItem
                                key={id}
                                channel={ch}
                                serverId={serverId!}
                                channelId={channelId}
                                onChannelClick={closeSidebarOnMobile}
                                onCopyChannelId={(channel) =>
                                  void handleCopyToClipboard(
                                    channel.id,
                                    'Channel ID',
                                  )
                                }
                                onCreateClick={(categoryId) =>
                                  openCreateDialog('Text', categoryId)
                                }
                                onInviteClick={() => setInviteModalOpen(true)}
                                onOpenServerSettings={
                                  isGuildOwner ? openServerSettings : undefined
                                }
                                canManageServer={isGuildOwner}
                                canLeaveGuild={!isGuildOwner}
                                onLeaveGuild={
                                  !isGuildOwner ? handleLeaveGuild : undefined
                                }
                                onOpenPermissions={openPermissionsDialog}
                              />
                            )
                          })}
                        </SortableContext>
                      </div>

                      <SortableContext
                        items={localOrder['__categories__'] ?? []}
                        strategy={verticalListSortingStrategy}
                      >
                        {sortedCategories.map((cat) => (
                          <SortableCategory
                            key={cat.id}
                            category={cat}
                            items={localOrder[cat.id] ?? []}
                            channelMap={channelMap}
                            serverId={serverId!}
                            channelId={channelId}
                            collapsed={!!collapsedCategories[cat.id]}
                            onToggle={() => toggleCategory(cat.id)}
                            onCreateClick={() =>
                              openCreateDialog('Text', cat.id)
                            }
                            onChannelClick={closeSidebarOnMobile}
                            onCopyCategoryId={(category) =>
                              void handleCopyToClipboard(
                                category.id,
                                'Category ID',
                              )
                            }
                            onCopyChannelId={(channel) =>
                              void handleCopyToClipboard(
                                channel.id,
                                'Channel ID',
                              )
                            }
                            onOpenPermissions={openPermissionsDialog}
                            onEditCategory={openCategorySettings}
                            onDeleteCategory={handleDeleteCategory}
                            isChannelOver={
                              !isCategoryDragging &&
                              !!activeId &&
                              findContainerOf(
                                activeId as string,
                                localOrder,
                              ) !== cat.id &&
                              (localOrder[cat.id] ?? []).includes(
                                activeId as string,
                              ) === false &&
                              false
                            }
                          />
                        ))}
                      </SortableContext>

                      <DragOverlay>
                        {activeChannel ? (
                          <SortableChannelItem
                            channel={activeChannel}
                            serverId={serverId!}
                            channelId={channelId}
                            isDragOverlay
                          />
                        ) : activeCategoryItem ? (
                          <div className='flex items-center gap-1 px-1 py-1 bg-sidebar border border-border/40 rounded shadow-lg opacity-95'>
                            <ChevronDown className='h-3 w-3 text-muted-foreground' />
                            <span className='text-xs font-semibold text-muted-foreground uppercase'>
                              {activeCategoryItem.name}
                            </span>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='w-60'>
                <ContextMenuLabel>Channel List</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => openCreateDialog('Text')}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create channel
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => openCreateDialog('Category')}>
                  <FolderOpen className='mr-2 h-4 w-4' />
                  Create category
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => setInviteModalOpen(true)}>
                  <Users className='mr-2 h-4 w-4' />
                  Invite people
                </ContextMenuItem>
                {serverId && (
                  <ContextMenuItem
                    onSelect={() =>
                      void handleCopyToClipboard(serverId, 'Server ID')
                    }
                  >
                    <Copy className='mr-2 h-4 w-4' />
                    Copy server ID
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                {isGuildOwner ? (
                  <ContextMenuItem onSelect={openServerSettings}>
                    <Settings className='mr-2 h-4 w-4' />
                    Server Settings
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem
                    className='text-destructive focus:text-destructive'
                    onSelect={handleLeaveGuild}
                    disabled={isLeaving}
                  >
                    Leave Server
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter>
          <div className='flex items-center space-x-2'>{userFooterMenu}</div>
        </SidebarFooter>
      </Sidebar>

      {serverId && (
        <CreateChannelDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          guildId={serverId}
          categories={categories}
          defaultKind={createDialogDefaultKind}
          defaultCategoryId={createDialogDefaultCategoryId}
        />
      )}
      {serverId && (
        <InviteModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          guildId={serverId}
        />
      )}
    </>
  )
}
