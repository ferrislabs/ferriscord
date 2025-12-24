import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 h-12 flex items-center">
          <Skeleton className="h-5 w-32" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="space-y-0.5 p-2">
          {/* Category header */}
          <div className="px-2 py-1.5">
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Channel items */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 px-2 py-1.5 mx-1">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}

          {/* Another category */}
          <div className="px-2 py-1.5 pt-4">
            <Skeleton className="h-3 w-28" />
          </div>

          {/* More items */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 px-2 py-1.5 mx-1">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
