import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import ServerNav from '@/components/layout/server-nav'
import type { PropsWithChildren } from 'react'


export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen w-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          {children}
        </SidebarInset>
        <ServerNav />
      </SidebarProvider>
    </div>
  );
}
