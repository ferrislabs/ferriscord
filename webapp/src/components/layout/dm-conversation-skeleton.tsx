import { Skeleton } from "@/components/ui/skeleton"

export function DMConversationSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Welcome Message Skeleton */}
        <div className="flex flex-col items-center text-center py-8">
          <Skeleton className="h-20 w-20 rounded-full mb-4" />
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Message List Skeleton */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              {i % 3 === 0 && <Skeleton className="h-4 w-3/4 max-w-sm" />}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input Skeleton */}
      <div className="p-4 border-t border-sidebar-border">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
