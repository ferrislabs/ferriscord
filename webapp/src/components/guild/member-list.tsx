import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PresenceIndicator } from '@/components/ui/presence-indicator'
import { useGuildMembers } from '@/lib/queries/member-queries'
import { usePresenceStore, type PresenceStatus } from '@/stores/presence.store'
import { useProfileCardStore } from '@/stores/profile-card.store'

// Map API status values (snake_case from Rust) to frontend PresenceStatus
function toPresenceStatus(apiStatus: string): PresenceStatus {
  if (apiStatus === 'do_not_disturb') return 'dnd'
  if (apiStatus === 'online' || apiStatus === 'idle' || apiStatus === 'offline') return apiStatus
  return 'offline'
}

// Group labels in Discord order
const GROUP_ORDER: PresenceStatus[] = ['online', 'idle', 'dnd', 'offline']
const GROUP_LABELS: Record<PresenceStatus, string> = {
  online: 'En ligne',
  idle: 'Absent',
  dnd: 'Ne pas déranger',
  offline: 'Hors ligne',
}

interface MemberListProps {
  guildId: string
  className?: string
}

export function MemberList({ guildId, className }: MemberListProps) {
  const { data: members = [] } = useGuildMembers(guildId)
  const toggleProfile = useProfileCardStore((s) => s.toggle)
  const userPresences = usePresenceStore((s) => s.userPresences)

  // Merge API presence with live WS presence
  const membersWithPresence = members.map((m) => ({
    ...m,
    presenceStatus: (userPresences[m.user_id] ?? toPresenceStatus(m.status)) as PresenceStatus,
  }))

  const grouped = GROUP_ORDER.reduce<Record<PresenceStatus, typeof membersWithPresence>>(
    (acc, status) => {
      acc[status] = membersWithPresence.filter((m) => m.presenceStatus === status)
      return acc
    },
    { online: [], idle: [], dnd: [], offline: [] },
  )

  return (
    <div className={cn("w-60 shrink-0 border-l border-sidebar-border bg-background flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {GROUP_ORDER.map((status) => {
            const group = grouped[status]
            if (group.length === 0) return null
            return (
              <div key={status}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
                  {GROUP_LABELS[status]} — {group.length}
                </p>
                <div className="space-y-0.5">
                  {group.map((member) => (
                    <div
                      key={member.member_id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer"
                      onClick={(e) => toggleProfile({
                        id: String(member.user_id),
                        username: member.username,
                        displayName: member.display_name,
                        avatarUrl: member.avatar_url,
                        guildId,
                        roles: member.roles,
                      }, e)}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url ?? undefined} alt={member.username} />
                          <AvatarFallback className="text-xs bg-indigo-500 text-white">
                            {member.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <PresenceIndicator
                          status={member.presenceStatus}
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium truncate', status === 'offline' && 'text-muted-foreground')}>
                          {member.display_name ?? member.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
