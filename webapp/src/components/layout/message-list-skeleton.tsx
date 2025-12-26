import { Skeleton } from "@/components/ui/skeleton"

export function MessageListSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Welcome section skeleton */}
      <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-sidebar-border">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      {/* Message skeletons */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-2">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-xl" />
            {i % 3 === 0 && <Skeleton className="h-4 w-3/4" />}
          </div>
        </div>
      ))}
    </div>
  )
}
