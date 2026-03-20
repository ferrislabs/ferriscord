import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => { },
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true
    return defaultCollapsed
  })

  // Sync with viewport: collapse on mobile, expand on desktop
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, side = "left", ...props }, ref) => {
    const { collapsed, setCollapsed } = useSidebar()

    return (
      <>
        {/* Mobile backdrop — closes sidebar on tap outside */}
        {!collapsed && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setCollapsed(true)}
          />
        )}
        <div
          ref={ref}
          className={cn(
            "bg-sidebar border-sidebar-border flex flex-col border-r transition-all duration-300 overflow-hidden",
            collapsed ? "w-0" : "w-60",
            // Mobile: fixed overlay on top of content
            // Desktop: normal flow element
            "fixed inset-y-0 left-0 z-40 md:static md:inset-auto md:z-auto",
            side === "right" && "border-r-0 border-l",
            className
          )}
          {...props}
        />
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-1 flex-col", className)}
        {...props}
      />
    )
  }
)
SidebarInset.displayName = "SidebarInset"

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("layout-header", className)}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-auto px-2 py-2", className)}
        {...props}
      />
    )
  }
)
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border-sidebar-border border-t px-2 py-3 shrink-0 min-h-14", className)}
        {...props}
      />
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"
