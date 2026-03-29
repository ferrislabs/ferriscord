import { useState } from 'react'
import { Copy, Check, Trash2, Plus } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useListInvites,
  useCreateInvite,
  useDeleteInvite,
} from '@/lib/queries/guild-queries'
import type { Schemas } from '@/api/api.client'

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guildId: string
}

function InviteRow({
  invite,
  guildId,
}: {
  invite: Schemas.Invite
  guildId: string
}) {
  const [copied, setCopied] = useState(false)
  const { mutateAsync: deleteInvite, isPending: isDeleting } = useDeleteInvite()

  const inviteUrl = `${window.location.origin}/invite/${invite.code}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    try {
      await deleteInvite({ path: { guild_id: guildId, invite_id: invite.id } })
      toast.success('Invite deleted')
    } catch {
      toast.error('Failed to delete invite')
    }
  }

  const isExpired =
    invite.expires_at && new Date(invite.expires_at) < new Date()
  const isMaxed = invite.max_uses != null && invite.uses >= invite.max_uses

  return (
    <div className='flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2'>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <code className='text-sm font-mono text-foreground'>
            {invite.code}
          </code>
          {(isExpired || isMaxed) && (
            <span className='text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5'>
              {isExpired ? 'Expired' : 'Exhausted'}
            </span>
          )}
        </div>
        <div className='text-xs text-muted-foreground mt-0.5'>
          {invite.uses} use{invite.uses !== 1 ? 's' : ''}
          {invite.max_uses != null && ` / ${invite.max_uses}`}
          {invite.expires_at &&
            ` · expires on ${new Date(invite.expires_at).toLocaleDateString('en-US')}`}
        </div>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 shrink-0'
        onClick={handleCopy}
      >
        {copied ? (
          <Check className='h-4 w-4 text-green-500' />
        ) : (
          <Copy className='h-4 w-4' />
        )}
      </Button>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 shrink-0 text-destructive hover:text-destructive'
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  )
}

export function InviteModal({ open, onOpenChange, guildId }: InviteModalProps) {
  const { data: invites = [], isLoading } = useListInvites(
    open ? guildId : null,
  )
  const { mutateAsync: createInvite, isPending: isCreating } = useCreateInvite()

  const handleCreate = async () => {
    try {
      await createInvite({ path: { guild_id: guildId }, body: {} })
      toast.success('Invite created')
    } catch {
      toast.error('Failed to create invite')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className='w-full'
            variant='outline'
          >
            <Plus className='h-4 w-4 mr-2' />
            {isCreating ? 'Creating...' : 'Create Invite'}
          </Button>

          {isLoading ? (
            <div className='text-sm text-muted-foreground text-center py-4'>
              Loading...
            </div>
          ) : invites.length === 0 ? (
            <div className='text-sm text-muted-foreground text-center py-4'>
              No active invites
            </div>
          ) : (
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {invites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} guildId={guildId} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
