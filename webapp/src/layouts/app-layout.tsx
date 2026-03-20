import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ServerNav from '@/components/layout/server-nav'
import type { PropsWithChildren } from 'react'
import { UserProfileCard } from '@/components/chat/user-profile-card'
import { useProfileCardStore } from '@/stores/profile-card.store'

function GlobalProfileCard() {
  const { user, anchorRect, close } = useProfileCardStore()
  if (!user || !anchorRect) return null
  return <UserProfileCard user={user} anchorRect={anchorRect} onClose={close} />
}


export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen w-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto pb-14 md:pb-0">
          {children}
        </SidebarInset>
        <ServerNav />
      </SidebarProvider>
      <GlobalProfileCard />
    </div>
  );
}
