import { Spinner } from "./spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  className?: string
  message?: string
}

export function PageLoader({ className, message }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full w-full",
        className
      )}
    >
      <Spinner className="size-8 text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
