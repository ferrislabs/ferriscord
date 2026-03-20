import {
  Hash,
  Volume2,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Plus,
} from 'lucide-react'
import { Link, useParams, useNavigate, useMatchRoute } from '@tanstack/react-router'
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
import { useGuildChannels, useCreateChannel } from '@/lib/queries/channel-queries'
import { useUserGuilds } from '@/lib/queries/guild-queries'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Schemas } from '@/api/api.client'
import { ProfileDialog } from '@/components/layout/profile-dialog'
import { useGetMe } from '@/lib/queries/user-queries'

// Mock DM users
const mockDMUsers = [
  {
    userId: '935833137349541918',
    username: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    status: 'online',
  },
  {
    userId: '835833137349541919',
    username: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    status: 'idle',
  },
  {
    userId: '735833137349541920',
    username: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    status: 'dnd',
  },
  {
    userId: '635833137349541921',
    username: 'Diana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    status: 'offline',
  },
]

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'idle': return 'bg-yellow-500'
    case 'dnd': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

type ChannelKind = 'Text' | 'Voice'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guildId: string
  defaultKind?: ChannelKind
}

function CreateChannelDialog({ open, onOpenChange, guildId, defaultKind = 'Text' }: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ChannelKind>(defaultKind)

  useEffect(() => {
    if (open) {
      setKind(defaultKind)
      setName('')
    }
  }, [open, defaultKind])
  const { mutateAsync: createChannel, isPending } = useCreateChannel()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createChannel({
        path: { guild_id: guildId },
        body: { name: name.trim(), kind },
      })
      toast.success(`#${name.trim()} créé`)
      onOpenChange(false)
    } catch {
      toast.error('Erreur lors de la création du channel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Kind selector */}
          <div className='grid grid-cols-2 gap-3'>
            {(['Text', 'Voice'] as const).map((k) => (
              <button
                key={k}
                type='button'
                onClick={() => setKind(k)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all duration-150',
                  kind === k
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/70',
                )}
              >
                {k === 'Text' ? (
                  <Hash className='h-5 w-5 shrink-0' />
                ) : (
                  <Volume2 className='h-5 w-5 shrink-0' />
                )}
                <div>
                  <div className='text-sm font-medium'>
                    {k === 'Text' ? 'Texte' : 'Vocal'}
                  </div>
                  <div className='text-xs opacity-60 mt-0.5'>
                    {k === 'Text' ? 'Messages, liens, fichiers' : 'Appel vocal'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Name */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
              Nom du channel
            </label>
            <div className='relative'>
              <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60'>
                {kind === 'Text' ? <Hash className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='nouveau-channel'
                className='pl-9'
                disabled={isPending}
                autoFocus
                maxLength={100}
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-1'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type='submit' disabled={isPending || !name.trim()}>
              {isPending ? 'Création...' : 'Créer le channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ChannelSectionProps {
  label: string
  channels: Schemas.Channel[]
  serverId: string
  channelId: string | undefined
  onCreateClick: () => void
}

function ChannelSection({
  label,
  channels,
  serverId,
  channelId,
  onCreateClick,
}: ChannelSectionProps) {
  const kindIcon = label === 'Texte' ? Hash : Volume2
  const Icon = kindIcon

  return (
    <div className='mb-2'>
      <div className='group flex items-center justify-between px-2 py-1.5'>
        <span className='text-xs font-semibold text-muted-foreground uppercase'>
          {label}
        </span>
        <button
          onClick={onCreateClick}
          className='opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50'
          title={`Créer un channel ${label.toLowerCase()}`}
        >
          <Plus className='h-3.5 w-3.5' />
        </button>
      </div>
      {channels.map((channel) => (
        <Link
          key={channel.id}
          to='/channels/$serverId/$channelId'
          params={{ serverId, channelId: channel.id }}
        >
          <div
            className={cn(
              'flex items-center space-x-2 px-2 py-1.5 mx-1 rounded cursor-pointer transition-colors',
              channelId === channel.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <Icon className='h-4 w-4 shrink-0' />
            <span className='text-sm font-medium truncate'>{channel.name}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function AppSidebar() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { user, signOut } = useAuth()
  const { data: profile } = useGetMe()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogDefaultKind, setCreateDialogDefaultKind] = useState<ChannelKind>('Text')
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  const isDMRoute =
    matchRoute({ to: '/channels/@me' }) ||
    matchRoute({ to: '/channels/@me/$userId' })

  const serverId = params.serverId ?? null
  const channelId = params.channelId
  const currentUserId = params.userId

  const { data: guilds } = useUserGuilds()
  const guild = guilds?.find((g) => g.id === serverId)

  const { data: channels = [], isLoading: isLoadingChannels } =
    useGuildChannels(serverId)

  const textChannels = channels.filter((ch) => ch.kind === 'Text')
  const voiceChannels = channels.filter((ch) => ch.kind === 'Voice')

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  const openCreateDialog = (kind: ChannelKind) => {
    setCreateDialogDefaultKind(kind)
    setCreateDialogOpen(true)
  }

  // DM Sidebar
  if (isDMRoute) {
    return (
      <>
      <Sidebar>
        <SidebarHeader>
          <div className='flex items-center justify-between px-2 h-8'>
            <span className='font-semibold text-foreground'>Direct Messages</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <ScrollArea className='flex-1'>
            <div className='space-y-0.5 p-2'>
              <Link to='/channels/@me'>
                <div
                  className={cn(
                    'flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                    !currentUserId
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  <Users className='h-5 w-5 shrink-0' />
                  <span className='text-sm font-medium'>Friends</span>
                </div>
              </Link>

              <div className='pt-4 pb-2'>
                <div className='px-2 text-xs font-semibold text-muted-foreground uppercase'>
                  Direct Messages
                </div>
              </div>

              {mockDMUsers.map((dmUser) => (
                <Link
                  key={dmUser.userId}
                  to='/channels/@me/$userId'
                  params={{ userId: dmUser.userId }}
                >
                  <div
                    className={cn(
                      'flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                      currentUserId === dmUser.userId
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )}
                  >
                    <div className='relative'>
                      <Avatar className='h-7 w-7'>
                        <AvatarImage src={dmUser.avatar} alt={dmUser.username} />
                        <AvatarFallback className='text-xs'>
                          {dmUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar',
                          getStatusColor(dmUser.status),
                        )}
                      />
                    </div>
                    <span className='text-sm truncate'>{dmUser.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={profile?.avatar_url ?? user?.avatar} alt={profile?.display_name ?? user?.preferred_username} />
                <AvatarFallback className='bg-primary text-primary-foreground text-xs'>
                  {(profile?.display_name ?? user?.preferred_username)?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar',
                  getStatusColor('offline'),
                )}
              />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium text-foreground truncate'>
                {profile?.display_name ?? user?.preferred_username ?? 'Unknown User'}
              </div>
            </div>
            <div className='flex space-x-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-foreground'
                onClick={() => setProfileDialogOpen(true)}
              >
                <Settings className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-foreground'
                onClick={handleLogout}
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
    )
  }

  // Server Sidebar — Loading
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
              <div key={i} className='flex items-center space-x-2 px-2 py-1.5 mx-1'>
                <Skeleton className='h-4 w-4 shrink-0' />
                <Skeleton className='h-4 flex-1' />
              </div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <>
      <Sidebar>
        {/* Guild Header */}
        <SidebarHeader>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='w-full justify-between px-2 h-12 hover:bg-accent'
              >
                <span className='font-semibold text-foreground truncate'>
                  {guild?.name ?? '—'}
                </span>
                <ChevronDown className='h-4 w-4 text-muted-foreground' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-56'>
              <DropdownMenuItem onSelect={() => openCreateDialog('Text')}>
                <Plus className='h-4 w-4 mr-2' />
                Créer un channel
              </DropdownMenuItem>
              <DropdownMenuItem className='text-destructive'>
                Quitter le serveur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        {/* Channels */}
        <SidebarContent>
          <ScrollArea className='flex-1'>
            <div className='space-y-0.5 pt-2'>
              {channels.length === 0 ? (
                <div className='px-4 py-6 text-center'>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Pas encore de channels
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => openCreateDialog('Text')}
                  >
                    <Plus className='h-4 w-4 mr-1.5' />
                    Créer un channel
                  </Button>
                </div>
              ) : (
                <>
                  {textChannels.length > 0 && serverId && (
                    <ChannelSection
                      label='Texte'
                      channels={textChannels}
                      serverId={serverId}
                      channelId={channelId}
                      onCreateClick={() => openCreateDialog('Text')}
                    />
                  )}
                  {voiceChannels.length > 0 && serverId && (
                    <ChannelSection
                      label='Vocal'
                      channels={voiceChannels}
                      serverId={serverId}
                      channelId={channelId}
                      onCreateClick={() => openCreateDialog('Voice')}
                    />
                  )}
                  {/* Show create button in sections that are empty */}
                  {textChannels.length === 0 && (
                    <div className='mb-2'>
                      <div className='group flex items-center justify-between px-2 py-1.5'>
                        <span className='text-xs font-semibold text-muted-foreground uppercase'>
                          Texte
                        </span>
                        <button
                          onClick={() => openCreateDialog('Text')}
                          className='opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        >
                          <Plus className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </div>
                  )}
                  {voiceChannels.length === 0 && (
                    <div className='mb-2'>
                      <div className='group flex items-center justify-between px-2 py-1.5'>
                        <span className='text-xs font-semibold text-muted-foreground uppercase'>
                          Vocal
                        </span>
                        <button
                          onClick={() => openCreateDialog('Voice')}
                          className='opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        >
                          <Plus className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </SidebarContent>

        {/* User Panel */}
        <SidebarFooter>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={profile?.avatar_url ?? user?.avatar} alt={profile?.display_name ?? user?.preferred_username} />
                <AvatarFallback className='bg-primary text-primary-foreground text-xs'>
                  {(profile?.display_name ?? user?.preferred_username)?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar',
                  getStatusColor('offline'),
                )}
              />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium text-foreground truncate'>
                {profile?.display_name ?? user?.preferred_username ?? 'Unknown User'}
              </div>
            </div>
            <div className='flex space-x-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-foreground'
                onClick={() => setProfileDialogOpen(true)}
              >
                <Settings className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-foreground'
                onClick={handleLogout}
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {serverId && (
        <CreateChannelDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          guildId={serverId}
          defaultKind={createDialogDefaultKind}
        />
      )}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  )
}
