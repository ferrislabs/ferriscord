import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'nav'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 select-none",
          {
            // Variant styles
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85 active:bg-primary/95": variant === 'default',
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85 active:bg-destructive/95": variant === 'destructive',
            "bg-muted/60 text-foreground border border-transparent hover:bg-muted/90 hover:border-border/50": variant === 'outline',
            "bg-secondary text-secondary-foreground hover:bg-secondary/70": variant === 'secondary',
            "hover:bg-muted/60 text-foreground": variant === 'ghost',
            "text-primary underline-offset-4 hover:underline": variant === 'link',
            "bg-background hover:bg-accent/50 rounded-lg": variant === 'nav',

            // Size styles
            "h-10 px-4 py-2": size === 'default',
            "h-9 rounded-md px-3": size === 'sm',
            "h-11 rounded-md px-8": size === 'lg',
            "h-10 w-10": size === 'icon',
            "h-12 w-12": size === 'icon-sm',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
