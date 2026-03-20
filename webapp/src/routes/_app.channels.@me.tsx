import { createFileRoute, useNavigate, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UserPlus, Users, Clock, Check, X, Trash2 } from 'lucide-react'
import { saveLastVisited } from '@/lib/last-visited'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  useListFriends,
  useListIncomingRequests,
  useListOutgoingRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
} from '@/lib/queries/friend-queries'
import { useCreateOrGetDm } from '@/lib/queries/dm-queries'
import { toast } from 'sonner'
import type { Schemas } from '@/api/api.client'

export const Route = createFileRoute('/_app/channels/@me')({
  component: FriendsPage,
})

type Tab = 'all' | 'pending'

function FriendRow({
  friendship,
  onMessage,
}: {
  friendship: Schemas.Friendship
  onMessage: (userId: string) => void
}) {
  const removeFriend = useRemoveFriend()
  const displayName = friendship.user.display_name ?? friendship.user.username

  return (
    <div className="flex items-center px-4 py-3 hover:bg-accent/50 rounded-lg transition-colors">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={friendship.user.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{displayName}</div>
        <div className="text-sm text-muted-foreground truncate">
          @{friendship.user.username}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onMessage(friendship.user.id)}
        >
          Message
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() =>
            removeFriend.mutate(
              { path: { user_id: friendship.user.id } },
              {
                onSuccess: () => toast.success(`${displayName} retiré de vos amis`),
                onError: () => toast.error('Erreur'),
              },
            )
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function IncomingRow({
  friendship,
  onAccepted,
}: {
  friendship: Schemas.Friendship
  onAccepted: (userId: string) => void
}) {
  const accept = useAcceptFriendRequest()
  const decline = useDeclineFriendRequest()
  const displayName = friendship.user.display_name ?? friendship.user.username

  return (
    <div className="flex items-center px-4 py-3 hover:bg-accent/50 rounded-lg transition-colors">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={friendship.user.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{displayName}</div>
        <div className="text-sm text-muted-foreground">Demande reçue</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={() =>
            accept.mutate(
              { path: { request_id: friendship.id } },
              {
                onSuccess: () => {
                  toast.success(`${displayName} ajouté comme ami`)
                  onAccepted(friendship.user.id)
                },
                onError: () => toast.error('Erreur'),
              },
            )
          }
          disabled={accept.isPending}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() =>
            decline.mutate(
              { path: { request_id: friendship.id } },
              {
                onSuccess: () => toast.success('Demande refusée'),
                onError: () => toast.error('Erreur'),
              },
            )
          }
          disabled={decline.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function OutgoingRow({ friendship }: { friendship: Schemas.Friendship }) {
  const displayName = friendship.user.display_name ?? friendship.user.username

  return (
    <div className="flex items-center px-4 py-3 hover:bg-accent/50 rounded-lg transition-colors">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={friendship.user.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">{displayName}</div>
        <div className="text-sm text-muted-foreground">Demande envoyée</div>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

function FriendsPage() {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const isInDm = matchRoute({ to: '/channels/@me/$channelId', fuzzy: true })
  const [tab, setTab] = useState<Tab>('all')
  const [addUsername, setAddUsername] = useState('')

  const { data: friends = [], isLoading: friendsLoading, isError: friendsError } = useListFriends()
  const { data: incoming = [] } = useListIncomingRequests()
  const { data: outgoing = [] } = useListOutgoingRequests()
  const sendRequest = useSendFriendRequest()
  const createOrGetDm = useCreateOrGetDm()

  useEffect(() => {
    saveLastVisited('/channels/@me')
  }, [])

  const pendingCount = incoming.length

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim()) return
    sendRequest.mutate(
      { body: { username: addUsername.trim() } },
      {
        onSuccess: () => {
          toast.success(`Demande envoyée à @${addUsername.trim()}`)
          setAddUsername('')
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.Unknown?.message ?? 'Erreur lors de la demande')
        },
      },
    )
  }

  const handleMessage = (userId: string) => {
    createOrGetDm.mutate(
      { body: { recipient_id: userId } },
      {
        onSuccess: (dm) => {
          navigate({ to: '/channels/@me/$channelId', params: { channelId: dm.id } })
        },
        onError: () => toast.error('Impossible d\'ouvrir la conversation'),
      },
    )
  }

  if (isInDm) {
    return <Outlet />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center gap-4 bg-background">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Users className="h-5 w-5" />
          <span>Amis</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('all')}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              tab === 'all'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )}
          >
            Tous ({friends.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1.5',
              tab === 'pending'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )}
          >
            En attente
            {pendingCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Add friend form */}
        <div className="p-4 border-b border-sidebar-border">
          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un ami
          </p>
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <Input
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="flex-1"
              disabled={sendRequest.isPending}
            />
            <Button
              type="submit"
              disabled={!addUsername.trim() || sendRequest.isPending}
              size="sm"
            >
              {sendRequest.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </form>
        </div>

        <div className="p-4">
          {tab === 'all' && (
            <>
              {friendsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Chargement...</p>
                </div>
              ) : friendsError ? (
                <div className="text-center py-12 text-destructive">
                  <p>Erreur lors du chargement des amis</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Pas encore d'amis. Envoyez une demande ci-dessus !</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Amis — {friends.length}
                  </div>
                  {friends.map((f) => (
                    <FriendRow key={f.id} friendship={f} onMessage={handleMessage} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'pending' && (
            <div className="space-y-4">
              {incoming.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Demandes reçues — {incoming.length}
                  </div>
                  <div className="space-y-1">
                    {incoming.map((f) => (
                      <IncomingRow key={f.id} friendship={f} onAccepted={handleMessage} />
                    ))}
                  </div>
                </div>
              )}
              {outgoing.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Demandes envoyées — {outgoing.length}
                  </div>
                  <div className="space-y-1">
                    {outgoing.map((f) => (
                      <OutgoingRow key={f.id} friendship={f} />
                    ))}
                  </div>
                </div>
              )}
              {incoming.length === 0 && outgoing.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Aucune demande en attente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
