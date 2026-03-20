import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarContextValue = {
  imageLoaded: boolean
  setImageLoaded: (v: boolean) => void
}

const AvatarContext = React.createContext<AvatarContextValue>({
  imageLoaded: false,
  setImageLoaded: () => {},
})

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, onLoad, onError, ...props }, ref) => {
  const { setImageLoaded } = React.useContext(AvatarContext)

  React.useEffect(() => {
    setImageLoaded(!!src)
  }, [src, setImageLoaded])

  if (!src) return null

  return (
    <img
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full", className)}
      onLoad={(e) => {
        setImageLoaded(true)
        onLoad?.(e)
      }}
      onError={(e) => {
        setImageLoaded(false)
        onError?.(e)
      }}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { imageLoaded } = React.useContext(AvatarContext)

  if (imageLoaded) return null

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
