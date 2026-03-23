import { useRef, useState, useEffect } from 'react'
import { Camera, Loader2, ImagePlus } from 'lucide-react'
import { toast } from '@/lib/toast'
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
import { Textarea } from '@/components/ui/textarea'
import { useGetMe, useUpdateProfile } from '@/lib/queries/user-queries'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: profile } = useGetMe()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name ?? '')
      setBio(profile.bio ?? '')
      setAvatarFile(null)
      setAvatarPreview(null)
      setBannerFile(null)
      setBannerPreview(null)
    }
  }, [open, profile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        displayName,
        avatar: avatarFile ?? undefined,
        bio,
        banner: bannerFile ?? undefined,
      })
      toast.success('Profil mis à jour')
      onOpenChange(false)
    } catch {
      toast.error('Erreur lors de la mise à jour du profil')
    }
  }

  const displayedAvatar = avatarPreview ?? profile?.avatar_url ?? undefined
  const displayedBanner = bannerPreview ?? profile?.banner_url ?? undefined
  const initials = (profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>

        <div className='space-y-5'>
          {/* Banner */}
          <div className='relative'>
            <button
              type='button'
              className='group relative w-full h-24 rounded-lg overflow-hidden focus:outline-none'
              onClick={() => bannerInputRef.current?.click()}
            >
              {displayedBanner ? (
                <img src={displayedBanner} alt='bannière' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600' />
              )}
              <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                <ImagePlus className='h-6 w-6 text-white' />
              </div>
            </button>
            <input
              ref={bannerInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleBannerChange}
            />

            {/* Avatar overlapping banner */}
            <button
              type='button'
              className='group absolute -bottom-6 left-4 rounded-full ring-4 ring-background focus:outline-none'
              onClick={() => avatarInputRef.current?.click()}
            >
              <Avatar className='h-14 w-14'>
                <AvatarImage src={displayedAvatar} />
                <AvatarFallback className='bg-primary text-primary-foreground text-xl'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                <Camera className='h-5 w-5 text-white' />
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleAvatarChange}
            />
          </div>

          <div className='pt-6 space-y-4'>
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

            {/* Bio */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold uppercase text-muted-foreground tracking-wide'>
                Bio
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder='Parlez de vous...'
                maxLength={190}
                rows={3}
                className='resize-none'
              />
              <p className='text-xs text-muted-foreground text-right'>{bio.length}/190</p>
            </div>
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
