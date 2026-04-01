import type { Schemas } from '@/api/api.client'

const VIEW_CHANNEL_PERMISSION = 2 ** 12
const SEND_MESSAGES_PERMISSION = 2 ** 13
const ADMINISTRATOR_PERMISSION = 2 ** 60
const DEFAULT_EVERYONE_PERMISSIONS =
  (2 ** 0) | VIEW_CHANNEL_PERMISSION | SEND_MESSAGES_PERMISSION

function hasPermission(mask: number, permission: number) {
  return Math.floor(mask / permission) % 2 === 1
}

function applyOverwrite(mask: number, allow: number, deny: number) {
  return (mask | allow) & ~deny
}

export function canSendMessagesInChannel({
  channel,
  channels,
  roles,
  member,
}: {
  channel: Schemas.Channel | undefined
  channels: Schemas.Channel[]
  roles: Schemas.RoleResponse[]
  member: Schemas.GuildMemberResponse | undefined
}) {
  if (!channel || !member) return true

  const everyoneRole = roles.find(
    (role) => role.name === '@everyone' || role.name === 'everyone',
  )
  const memberRoleIds = new Set(member.roles.map((role) => role.id))
  const activeRoles = roles
    .filter(
      (role) =>
        role.id === everyoneRole?.id || memberRoleIds.has(role.id as string),
    )
    .sort((a, b) => a.position - b.position)

  let permissions = activeRoles.reduce(
    (mask, role) =>
      mask |
      (role.id === everyoneRole?.id && role.permissions === 0
        ? DEFAULT_EVERYONE_PERMISSIONS
        : role.permissions),
    0,
  )

  if (hasPermission(permissions, ADMINISTRATOR_PERMISSION)) return true

  const parentChannel = channel.parent_id
    ? channels.find((entry) => entry.id === channel.parent_id)
    : undefined

  for (const source of [parentChannel, channel]) {
    if (!source) continue

    for (const role of activeRoles) {
      const overwrite = source.permission_overwrites.find(
        (entry) => entry.kind === 'Role' && entry.id === role.id,
      )
      if (overwrite) {
        permissions = applyOverwrite(
          permissions,
          overwrite.allow,
          overwrite.deny,
        )
      }
    }

    const memberOverwrite = source.permission_overwrites.find(
      (entry) => entry.kind === 'Member' && entry.id === member.user_id,
    )
    if (memberOverwrite) {
      permissions = applyOverwrite(
        permissions,
        memberOverwrite.allow,
        memberOverwrite.deny,
      )
    }
  }

  const canView = hasPermission(permissions, VIEW_CHANNEL_PERMISSION)
  const canSend = hasPermission(permissions, SEND_MESSAGES_PERMISSION)
  return canView && canSend
}
