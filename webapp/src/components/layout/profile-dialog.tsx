import { useRef, useState, useEffect } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGetMe, useUpdateProfile } from '@/lib/queries/user-queries'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: profile } = useGetMe()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name ?? '')
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [open, profile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        displayName,
        avatar: avatarFile ?? undefined,
      })
      toast.success('Profil mis à jour')
      onOpenChange(false)
    } catch {
      toast.error('Erreur lors de la mise à jour du profil')
    }
  }

  const displayedAvatar = avatarPreview ?? profile?.avatar_url ?? undefined
  const initials = (profile?.display_name ?? profile?.username ?? 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>

        <div className='space-y-5'>
          {/* Avatar */}
          <div className='flex flex-col items-center gap-3'>
            <button
              type='button'
              className='group relative rounded-full focus:outline-none'
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className='h-20 w-20'>
                <AvatarImage src={displayedAvatar} />
                <AvatarFallback className='bg-primary text-primary-foreground text-xl'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                <Camera className='h-6 w-6 text-white' />
              </div>
            </button>
            <span className='text-xs text-muted-foreground'>
              Cliquer pour changer l'avatar
            </span>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleAvatarChange}
            />
          </div>

          {/* Username (read-only) */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
              Nom d'utilisateur
            </Label>
            <Input value={profile?.username ?? ''} disabled />
          </div>

          {/* Display name */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
              Nom d'affichage
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Laisser vide pour utiliser le nom d'utilisateur"
              maxLength={64}
            />
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
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
