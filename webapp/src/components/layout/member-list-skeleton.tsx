import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar"

export function MemberListSkeleton() {
  return (
    <Sidebar side="right" className="w-60 bg-gray-100 border-l border-gray-200">
      <SidebarHeader className="layout-header-sidebar-light">
        <Skeleton className="h-4 w-24" />
      </SidebarHeader>

      <SidebarContent className="bg-gray-100">
        <div className="space-y-2 p-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
