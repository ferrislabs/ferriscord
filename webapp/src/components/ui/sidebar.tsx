import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => { },
})

function useSidebar() {
  return React.useContext(SidebarContext)
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

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
    const { collapsed } = useSidebar()

    return (
      <div
        ref={ref}
        className={cn(
          "bg-sidebar border-sidebar-border flex flex-col border-r transition-all duration-300",
          collapsed ? "w-0" : "w-60",
          side === "right" && "border-r-0 border-l",
          className
        )}
        {...props}
      />
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
