import { cn } from '@/lib/utils'
import type { PresenceStatus } from '@/stores/presence.store'

const statusConfig: Record<PresenceStatus, { color: string; label: string }> = {
  online: { color: 'bg-green-500', label: 'En ligne' },
  idle: { color: 'bg-yellow-400', label: 'Absent' },
  dnd: { color: 'bg-red-500', label: 'Ne pas déranger' },
  offline: { color: 'bg-gray-400', label: 'Hors ligne' },
}

interface PresenceIndicatorProps {
  status: PresenceStatus
  className?: string
  size?: 'sm' | 'md'
}

export function PresenceIndicator({ status, className, size = 'sm' }: PresenceIndicatorProps) {
  const { color, label } = statusConfig[status]
  return (
    <div
      className={cn(
        'rounded-full border-2 border-background',
        size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5',
        color,
        className,
      )}
      title={label}
    />
  )
}
