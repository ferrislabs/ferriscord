import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, X } from 'lucide-react'
import { useGetMe, useUpdateProfile } from '@/lib/queries/user-queries'
import { UserProfileSummary } from '@/components/chat/user-profile-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_app/settings')({
  component: UserSettingsPage,
})

function UserSettingsPage() {
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
  const profileId = profile?.id
  const profileDisplayName = profile?.display_name ?? ''
  const profileBio = profile?.bio ?? ''

  useEffect(() => {
    if (profileId) {
      setDisplayName(profileDisplayName)
      setBio(profileBio)
      setAvatarFile(null)
      setAvatarPreview(null)
      setBannerFile(null)
      setBannerPreview(null)
    }
  }, [profileId, profileDisplayName, profileBio])

  function handleClose() {
    history.back()
  }

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
      toast.success('Profile updated')
      handleClose()
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const handleReset = () => {
    setDisplayName(profile?.display_name ?? '')
    setBio(profile?.bio ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setBannerFile(null)
    setBannerPreview(null)
  }

  const displayedAvatar = avatarPreview ?? profile?.avatar_url ?? undefined
  const displayedBanner = bannerPreview ?? profile?.banner_url ?? undefined
  const initials = (profile?.display_name ??
    profile?.username ??
    'U')[0].toUpperCase()
  const isDirty =
    displayName !== (profile?.display_name ?? '') ||
    bio !== (profile?.bio ?? '') ||
    !!avatarFile ||
    !!bannerFile

  return (
    <div className='fixed inset-0 z-50 flex bg-background'>
      <div className='w-60 shrink-0 border-r border-sidebar-border bg-sidebar py-12 pr-2'>
        <div className='ml-auto w-44 space-y-0.5'>
          <p className='px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            User Settings
          </p>
          <button
            className={cn(
              'w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
              'bg-accent font-medium text-accent-foreground',
            )}
          >
            My Account
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-4xl px-8 py-12'>
          <div className='mb-8'>
            <h1 className='mb-1 text-xl font-bold text-foreground'>
              My Account
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage your profile like on Discord.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]'>
            <div className='space-y-6'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Banner
                </Label>
                <div className='relative'>
                  <button
                    type='button'
                    className='group relative h-36 w-full overflow-hidden rounded-xl focus:outline-none'
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {displayedBanner ? (
                      <img
                        src={displayedBanner}
                        alt='banner'
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600' />
                    )}
                    <div className='absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100'>
                      <ImagePlus className='h-7 w-7 text-white' />
                    </div>
                  </button>
                  <input
                    ref={bannerInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleBannerChange}
                  />

                  <button
                    type='button'
                    className='group absolute -bottom-8 left-5 rounded-full ring-4 ring-background focus:outline-none'
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className='h-20 w-20'>
                      <AvatarImage src={displayedAvatar} />
                      <AvatarFallback className='bg-primary text-xl text-primary-foreground'>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                      <Camera className='h-6 w-6 text-white' />
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
              </div>

              <div className='pt-10 space-y-4'>
                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Username
                  </Label>
                  <Input value={profile?.username ?? ''} disabled />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Display Name
                  </Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='Leave blank to use your username'
                    maxLength={64}
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Bio
                  </Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder='Tell us about yourself...'
                    maxLength={190}
                    rows={5}
                    className='resize-none'
                  />
                  <p className='text-right text-xs text-muted-foreground'>
                    {bio.length}/190
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Preview
              </p>
              <UserProfileSummary
                displayName={displayName || profile?.username || 'Unknown User'}
                username={profile?.username ?? 'unknown'}
                avatarUrl={displayedAvatar}
                bio={bio}
                bannerUrl={displayedBanner}
                className='bg-card shadow-xl'
              />
            </div>
          </div>

          {isDirty && (
            <div className='animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 fixed bottom-6 left-1/2 z-20 flex w-[min(680px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/95 px-5 py-3 shadow-2xl backdrop-blur-md duration-200'>
              <p className='text-sm text-muted-foreground'>Unsaved changes</p>
              <div className='flex shrink-0 gap-2'>
                <Button variant='ghost' size='sm' onClick={handleReset}>
                  Reset
                </Button>
                <Button size='sm' onClick={handleSave} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='absolute right-4 top-4'>
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9 rounded-full'
          onClick={handleClose}
        >
          <X className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}
