import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { useJoinGuild } from '@/lib/queries/guild-queries'

interface InviteEmbedProps {
  code: string
}

function useInvitePreview(code: string) {
  return useQuery({
    ...window.tanstackApi.get('/invites/{code}', { path: { code } }).queryOptions,
    retry: false,
  })
}

export function InviteEmbed({ code }: InviteEmbedProps) {
  const { data: preview, isLoading, isError } = useInvitePreview(code)
  const { mutateAsync: joinGuild, isPending } = useJoinGuild()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className='mt-2 w-80 rounded-lg border border-border bg-muted/40 p-4 animate-pulse'>
        <div className='h-4 w-32 bg-muted rounded mb-2' />
        <div className='h-3 w-48 bg-muted rounded' />
      </div>
    )
  }

  if (isError || !preview) return null

  const isExpired = preview.expires_at && new Date(preview.expires_at) < new Date()
  const isMaxed = preview.max_uses != null && preview.uses >= preview.max_uses
  const canJoin = !isExpired && !isMaxed

  const handleJoin = async () => {
    try {
      const guild = await joinGuild({ body: { code } })
      toast.success(`Tu as rejoint ${guild.name} !`)
      navigate({
        to: '/channels/$serverId/$channelId',
        params: { serverId: guild.id, channelId: '0' },
      })
    } catch {
      toast.error("Code d'invitation invalide ou expiré")
    }
  }

  return (
    <div className='mt-2 w-80 rounded-lg border border-border bg-card shadow-sm overflow-hidden'>
      <div className='px-4 py-3 border-b border-border/50'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Invitation à rejoindre un serveur
        </p>
      </div>
      <div className='px-4 py-3 flex items-center gap-3'>
        {/* Guild icon placeholder */}
        <div className='h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg font-bold text-primary'>
          {preview.guild_name[0].toUpperCase()}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='font-semibold text-foreground truncate'>{preview.guild_name}</p>
          <div className='flex items-center gap-1 text-xs text-muted-foreground mt-0.5'>
            <Users className='h-3 w-3' />
            <span>
              {preview.uses} membre{preview.uses !== 1 ? 's' : ''}
              {preview.max_uses != null && ` / ${preview.max_uses} max`}
            </span>
          </div>
          {(isExpired || isMaxed) && (
            <p className='text-xs text-destructive mt-0.5'>
              {isExpired ? 'Invitation expirée' : 'Nombre maximal atteint'}
            </p>
          )}
        </div>
        <Button
          size='sm'
          variant={canJoin ? 'default' : 'secondary'}
          onClick={handleJoin}
          disabled={!canJoin || isPending}
          className='shrink-0'
        >
          {isPending ? '...' : 'Rejoindre'}
        </Button>
      </div>
    </div>
  )
}

const INVITE_URL_RE = /(?:https?:\/\/[^\s/]+)?\/invite\/([A-Za-z0-9]{6,12})/g

export function extractInviteCodes(content: string): string[] {
  const codes: string[] = []
  let match: RegExpExecArray | null
  while ((match = INVITE_URL_RE.exec(content)) !== null) {
    codes.push(match[1])
  }
  return [...new Set(codes)]
}
