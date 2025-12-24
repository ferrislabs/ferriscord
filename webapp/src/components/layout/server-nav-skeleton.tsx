import { Skeleton } from "@/components/ui/skeleton"

export function ServerNavSkeleton() {
  return (
    <nav className="bg-sidebar border-sidebar-border flex h-screen flex-col items-center gap-2 border-l p-2">
      {/* Home and Explore buttons */}
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-10 w-10 rounded-lg" />

      {/* More options button */}
      <Skeleton className="h-10 w-10 rounded-lg" />

      {/* Server list */}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-10 w-10 rounded-sm" />
        <Skeleton className="h-10 w-10 rounded-sm" />
        <Skeleton className="h-10 w-10 rounded-sm" />
        <Skeleton className="h-10 w-10 rounded-sm" />
        <Skeleton className="h-10 w-10 rounded-sm" />
      </div>

      {/* Theme toggle at bottom */}
      <Skeleton className="h-10 w-10 rounded-lg" />
    </nav>
  )
}
