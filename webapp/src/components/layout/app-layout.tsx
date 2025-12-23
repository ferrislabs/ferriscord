import { AppSidebar } from './app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ServerNav from './server-nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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
