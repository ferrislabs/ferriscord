import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useOidc } from '@axa-fr/react-oidc'
import { useUserStore } from '@/stores/user.store'
import { useJoinGuild } from '@/lib/queries/guild-queries'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/page-loader'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/invite/$code')({
  component: InvitePage,
})

function InvitePage() {
  const { code } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated, login } = useOidc()
  const isLoading = useUserStore((s) => s.isLoading)
  const { mutateAsync: joinGuild, isPending } = useJoinGuild()
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      login(`/invite/${code}`)
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return <PageLoader message='Chargement...' />
  }

  const handleJoin = async () => {
    setJoining(true)
    try {
      const guild = await joinGuild({ body: { code } })
      toast.success(`Tu as rejoint ${guild.name} !`)
      navigate({ to: '/channels/$serverId/$channelId', params: { serverId: guild.id, channelId: '0' } })
    } catch {
      toast.error("Code d'invitation invalide ou expiré")
      setJoining(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg text-center space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-xl font-bold text-foreground'>Invitation à rejoindre un serveur</h1>
          <p className='text-sm text-muted-foreground'>
            Tu as été invité avec le code <code className='font-mono bg-muted px-1.5 py-0.5 rounded text-foreground'>{code}</code>
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <Button onClick={handleJoin} disabled={isPending || joining} className='w-full'>
            {isPending || joining ? 'Rejoindre...' : 'Rejoindre le serveur'}
          </Button>
          <Button variant='ghost' onClick={() => navigate({ to: '/channels/@me' })} className='w-full'>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}
