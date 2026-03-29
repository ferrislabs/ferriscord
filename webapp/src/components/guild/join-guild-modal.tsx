import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useJoinGuild } from '@/lib/queries/guild-queries'

interface JoinGuildModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGuildModal({ open, onOpenChange }: JoinGuildModalProps) {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const { mutateAsync: joinGuild, isPending } = useJoinGuild()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    try {
      const guild = await joinGuild({ body: { code: trimmed } })
      toast.success(`You joined ${guild.name}!`)
      onOpenChange(false)
      setCode('')
      navigate({
        to: '/channels/$serverId/$channelId',
        params: { serverId: guild.id, channelId: '0' },
      })
    } catch {
      toast.error('Invalid or expired invite code')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Join a Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
              Invite Code
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder='Ex: aB3dEf8G'
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !code.trim()}>
              {isPending ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
