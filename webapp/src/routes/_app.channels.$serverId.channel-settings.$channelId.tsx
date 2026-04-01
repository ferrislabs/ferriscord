import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useGuildChannels,
  useUpdateChannel,
} from '@/lib/queries/channel-queries'
import { useGuildRoles } from '@/lib/queries/member-queries'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth.store'
import type { Schemas } from '@/api/api.client'
import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  Folder,
  Hash,
  Lock,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react'

const VIEW_CHANNEL_PERMISSION = 2 ** 12
const SEND_MESSAGES_PERMISSION = 2 ** 13

type SettingsTab = 'overview' | 'permissions'

export const Route = createFileRoute(
  '/_app/channels/$serverId/channel-settings/$channelId',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search.tab === 'permissions' || search.tab === 'overview'
        ? (search.tab as SettingsTab)
        : 'overview',
  }),
  component: ChannelSettingsPage,
})

function hasPermissionBit(mask: number, permission: number) {
  return Math.floor(mask / permission) % 2 === 1
}

function addPermissionBit(mask: number, permission: number) {
  return hasPermissionBit(mask, permission) ? mask : mask + permission
}

function removePermissionBit(mask: number, permission: number) {
  return hasPermissionBit(mask, permission) ? mask - permission : mask
}

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
        'relative h-6 w-12 rounded-full border transition-colors',
        checked
          ? 'border-primary/80 bg-primary'
          : 'border-border bg-background',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[24px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

function ChannelSettingsPage() {
  const { serverId, channelId } = Route.useParams()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: channels = [] } = useGuildChannels(serverId)
  const { data: rolesData = { data: [] } } = useGuildRoles(serverId)
  const { mutateAsync: updateChannel, isPending } = useUpdateChannel()
  const [tab, setTab] = useState<SettingsTab>(search.tab)
  const [name, setName] = useState('')
  const [draftOverwrites, setDraftOverwrites] = useState<
    Schemas.PermissionOverwrite[]
  >([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true)

  const channel = channels.find((item) => item.id === channelId) ?? null
  const roles = rolesData.data

  useEffect(() => {
    setTab(search.tab)
  }, [search.tab])

  useEffect(() => {
    if (!channel) return
    setName(channel.name)
    setDraftOverwrites(channel.permission_overwrites ?? [])
    setSelectedRoleId(null)
  }, [channel])

  const channelLabel = channel?.kind === 'Category' ? 'Category' : 'Channel'
  const titleIcon =
    channel?.kind === 'Category' ? (
      <Folder className='h-3.5 w-3.5 text-muted-foreground' />
    ) : (
      <Hash className='h-3.5 w-3.5 text-muted-foreground' />
    )

  const managedRoles = useMemo(
    () =>
      roles.filter((role) =>
        draftOverwrites.some(
          (overwrite) => overwrite.kind === 'Role' && overwrite.id === role.id,
        ),
      ),
    [roles, draftOverwrites],
  )

  const selectedRole =
    managedRoles.find((role) => role.id === selectedRoleId) ??
    managedRoles[0] ??
    null

  const selectedOverwrite = selectedRole
    ? (draftOverwrites.find(
        (overwrite) =>
          overwrite.kind === 'Role' && overwrite.id === selectedRole.id,
      ) ?? null)
    : null

  const availableRoles = roles.filter(
    (role) =>
      !draftOverwrites.some(
        (overwrite) => overwrite.kind === 'Role' && overwrite.id === role.id,
      ),
  )

  const everyoneRole = roles.find(
    (role) => role.name === '@everyone' || role.name === 'everyone',
  )

  const privateTarget =
    draftOverwrites.some(
      (overwrite) =>
        overwrite.kind === 'Role' &&
        overwrite.id === everyoneRole?.id &&
        hasPermissionBit(overwrite.deny, VIEW_CHANNEL_PERMISSION),
    ) ?? false

  const permissionSections: Array<{
    title: string
    rows: Array<{
      title: string
      description: string
      permission: number
    }>
  }> = [
    {
      title:
        channel?.kind === 'Category'
          ? 'General Category Permissions'
          : 'General Channel Permissions',
      rows: [
        {
          title: 'View Channels',
          description:
            channel?.kind === 'Category'
              ? 'Allows members to view these channels by default. Disabling this for @everyone will make text channels private.'
              : 'Allows members to view this channel by default.',
          permission: VIEW_CHANNEL_PERMISSION,
        },
      ],
    },
    {
      title: 'Text Channel Permissions',
      rows: [
        {
          title: 'Send Messages and Create Posts',
          description:
            'Allows members to send messages and create posts in this channel.',
          permission: SEND_MESSAGES_PERMISSION,
        },
      ],
    },
  ]

  const setPermissionState = (
    roleId: string,
    permission: number,
    state: 'deny' | 'inherit' | 'allow',
  ) => {
    setDraftOverwrites((current) => {
      const existing = current.find(
        (overwrite) => overwrite.kind === 'Role' && overwrite.id === roleId,
      ) ?? {
        id: roleId,
        kind: 'Role' as const,
        allow: 0,
        deny: 0,
      }

      let allow = removePermissionBit(existing.allow, permission)
      let deny = removePermissionBit(existing.deny, permission)

      if (state === 'allow') allow = addPermissionBit(allow, permission)
      if (state === 'deny') deny = addPermissionBit(deny, permission)

      const next = { ...existing, allow, deny }
      const filtered = current.filter(
        (overwrite) => !(overwrite.kind === 'Role' && overwrite.id === roleId),
      )

      if (next.allow === 0 && next.deny === 0) return filtered
      return [...filtered, next]
    })
  }

  const handleAddRole = (roleId: string) => {
    setDraftOverwrites((current) => [
      ...current,
      { id: roleId, kind: 'Role', allow: 0, deny: 0 },
    ])
    setSelectedRoleId(roleId)
  }

  const handleRemoveRole = (roleId: string) => {
    setDraftOverwrites((current) =>
      current.filter(
        (overwrite) => !(overwrite.kind === 'Role' && overwrite.id === roleId),
      ),
    )
    setSelectedRoleId((current) => (current === roleId ? null : current))
  }

  const handlePrivateToggle = () => {
    if (!everyoneRole?.id) return

    if (privateTarget) {
      setPermissionState(everyoneRole.id, VIEW_CHANNEL_PERMISSION, 'inherit')
      setPermissionState(everyoneRole.id, SEND_MESSAGES_PERMISSION, 'inherit')
      return
    }

    setPermissionState(everyoneRole.id, VIEW_CHANNEL_PERMISSION, 'deny')
    setPermissionState(everyoneRole.id, SEND_MESSAGES_PERMISSION, 'deny')
    setSelectedRoleId(everyoneRole.id)
  }

  const handleSave = async () => {
    if (!channel) return

    try {
      await updateChannel({
        path: { guild_id: serverId, channel_id: channel.id },
        body: {
          parent_id: channel.parent_id ?? null,
          position: channel.position,
          name: name.trim() || channel.name,
          permission_overwrites: draftOverwrites,
        },
      } as any)
      toast.success(`${channelLabel} updated`)
    } catch {
      toast.error(`Failed to update ${channelLabel.toLowerCase()}`)
    }
  }

  const handleDelete = async () => {
    if (!channel) return

    try {
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
      toast.success(`${channelLabel} deleted`)
      history.back()
    } catch {
      toast.error(`Failed to delete ${channelLabel.toLowerCase()}`)
    }
  }

  const handleClose = () => {
    history.back()
  }

  const renderPermissionButtons = (
    roleId: string,
    permission: number,
    currentState: 'deny' | 'inherit' | 'allow',
  ) => (
    <div className='flex overflow-hidden rounded-lg border border-border/80 bg-background/60'>
      {(
        [
          ['deny', <X key='deny' className='h-4 w-4' />],
          [
            'inherit',
            <span key='inherit' className='text-base'>
              /
            </span>,
          ],
          ['allow', <Check key='allow' className='h-4 w-4' />],
        ] as Array<['deny' | 'inherit' | 'allow', React.ReactNode]>
      ).map(([state, icon]) => (
        <button
          key={state}
          type='button'
          onClick={() => setPermissionState(roleId, permission, state)}
          className={cn(
            'flex h-7 w-11 items-center justify-center border-l border-border/80 first:border-l-0 transition-colors',
            currentState === state
              ? state === 'allow'
                ? 'bg-emerald-500/15 text-emerald-400'
                : state === 'deny'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  )

  if (!channel) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background text-muted-foreground'>
        Channel not found.
      </div>
    )
  }

  return (
    <div className='fixed inset-0 z-50 flex bg-background'>
      <div className='w-60 shrink-0 border-r border-sidebar-border bg-sidebar py-12 pr-2'>
        <div className='ml-auto w-44 space-y-0.5'>
          <div className='mb-4 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
            {titleIcon}
            <span className='truncate'>{channel.name}</span>
          </div>

          <button
            type='button'
            onClick={() => setTab('overview')}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              tab === 'overview'
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            Overview
          </button>

          <button
            type='button'
            onClick={() => setTab('permissions')}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              tab === 'permissions'
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            Permissions
          </button>

          <div className='mt-6 border-t border-sidebar-border pt-6'>
            <button
              type='button'
              onClick={handleDelete}
              className='flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10'
            >
              <span>Delete {channelLabel}</span>
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-6xl px-10 py-12'>
          {tab === 'overview' && (
            <div className='max-w-3xl'>
              <h1 className='mb-6 text-3xl font-semibold text-foreground'>
                Overview
              </h1>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-foreground'>
                  {channelLabel} Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='h-12 max-w-3xl'
                />
              </div>
            </div>
          )}

          {tab === 'permissions' && (
            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='mb-5 max-w-5xl'>
                <h1 className='text-2xl font-semibold text-foreground'>
                  {channelLabel} Settings
                </h1>
                <p className='mt-1 text-[15px] text-muted-foreground'>
                  Use permissions to customise who can do what in this{' '}
                  {channel.kind === 'Category' ? 'category' : 'channel'}.
                </p>
              </div>

              <div className='mb-10 max-w-5xl rounded-2xl border border-border bg-card/70 p-5'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex items-start gap-3'>
                    <div className='mt-0.5 rounded-md bg-muted p-2 text-muted-foreground'>
                      <Lock className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='text-xl font-semibold text-foreground'>
                        Private {channelLabel}
                      </p>
                      <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                        By making this {channelLabel.toLowerCase()} private,
                        only select members and roles will be able to view it.
                        {channel.kind === 'Category'
                          ? ' Linked channels in this category will automatically match this setting.'
                          : ''}
                      </p>
                    </div>
                  </div>
                  <PermissionSwitch
                    checked={privateTarget}
                    onChange={handlePrivateToggle}
                  />
                </div>
              </div>

              <div className='mb-8 max-w-5xl border-t border-border pt-8'>
                <button
                  type='button'
                  onClick={() => setIsAdvancedOpen((value) => !value)}
                  className='flex items-center gap-2 text-[1.05rem] font-semibold text-foreground'
                >
                  <span>Advanced permissions</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isAdvancedOpen && 'rotate-180',
                    )}
                  />
                </button>
              </div>

              {isAdvancedOpen && (
                <div className='grid min-h-0 max-w-5xl flex-1 gap-8 md:grid-cols-[220px,minmax(0,1fr)] md:gap-10'>
                  <aside className='min-h-0 md:border-r md:border-border md:pr-8'>
                    <div className='mb-3 flex items-center justify-between'>
                      <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                        Roles/Members
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type='button'
                            className='rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                            disabled={availableRoles.length === 0}
                          >
                            <PlusCircle className='h-4 w-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='start'
                          className='w-56 border-border bg-popover p-1'
                        >
                          {availableRoles.length > 0 ? (
                            availableRoles.map((role) => (
                              <DropdownMenuItem
                                key={role.id}
                                onSelect={() => handleAddRole(role.id)}
                                className='flex items-center gap-2 rounded-md px-3 py-2'
                              >
                                <span
                                  className='h-2.5 w-2.5 rounded-full'
                                  style={{
                                    backgroundColor:
                                      role.color !== 0
                                        ? `#${role.color.toString(16).padStart(6, '0')}`
                                        : 'hsl(var(--muted-foreground))',
                                  }}
                                />
                                <span className='truncate'>{role.name}</span>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>
                              No more roles to add
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='rounded-xl border border-border/70 bg-card/30 p-2'>
                      {managedRoles.map((role) => (
                        <div
                          key={role.id}
                          className={cn(
                            'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                            selectedRole?.id === role.id
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50',
                          )}
                        >
                          <button
                            type='button'
                            onClick={() => setSelectedRoleId(role.id)}
                            className='flex min-w-0 flex-1 items-center gap-2 text-left'
                          >
                            <span className='truncate font-medium'>
                              {role.name}
                            </span>
                          </button>
                          {role.id !== everyoneRole?.id && (
                            <button
                              type='button'
                              onClick={() => handleRemoveRole(role.id)}
                              className='text-muted-foreground hover:text-foreground'
                            >
                              <X className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      ))}

                      {managedRoles.length === 0 && (
                        <p className='px-2 py-3 text-sm text-muted-foreground'>
                          No role overwrites yet.
                        </p>
                      )}
                    </div>

                    <a
                      href='https://support.discord.com/hc/en-us/articles/206141927'
                      target='_blank'
                      rel='noreferrer'
                      className='mt-4 block text-sm text-blue-400 transition-colors hover:text-blue-300'
                    >
                      Need help with permissions?
                    </a>
                  </aside>

                  <section className='min-h-0 md:pl-1'>
                    {selectedRole ? (
                      <div className='no-scrollbar h-full overflow-y-auto pr-2'>
                        {permissionSections.map((section) => (
                          <section
                            key={section.title}
                            className='mb-10 last:mb-0'
                          >
                            <h2 className='mb-5 text-[1.05rem] font-semibold text-foreground'>
                              {section.title}
                            </h2>

                            <div className='space-y-0'>
                              {section.rows.map((row) => {
                                const allow =
                                  selectedOverwrite &&
                                  hasPermissionBit(
                                    selectedOverwrite.allow,
                                    row.permission,
                                  )
                                const deny =
                                  selectedOverwrite &&
                                  hasPermissionBit(
                                    selectedOverwrite.deny,
                                    row.permission,
                                  )
                                const currentState:
                                  | 'deny'
                                  | 'inherit'
                                  | 'allow' = allow
                                  ? 'allow'
                                  : deny
                                    ? 'deny'
                                    : 'inherit'

                                return (
                                  <div
                                    key={row.title}
                                    className='grid gap-5 border-b border-border py-6 first:pt-0 md:grid-cols-[minmax(0,1fr),112px] md:items-start'
                                  >
                                    <div className='min-w-0'>
                                      <h3 className='text-[1.05rem] font-semibold text-foreground'>
                                        {row.title}
                                      </h3>
                                      <p className='mt-2 max-w-xl text-sm leading-7 text-muted-foreground'>
                                        {row.description}
                                      </p>
                                    </div>

                                    <div className='md:justify-self-end'>
                                      {renderPermissionButtons(
                                        selectedRole.id,
                                        row.permission,
                                        currentState,
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className='flex h-full min-h-[280px] items-center justify-center text-muted-foreground'>
                        Select a role to edit its overwrites.
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          )}

          <div className='mt-8 flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={handleClose}
              disabled={isPending}
            >
              Close
            </Button>
            <Button type='button' onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className='absolute right-6 top-6 flex flex-col items-center gap-2'>
        <button
          type='button'
          onClick={handleClose}
          className='flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground'
        >
          <X className='h-5 w-5' />
        </button>
        <span className='text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
          Esc
        </span>
      </div>
    </div>
  )
}
