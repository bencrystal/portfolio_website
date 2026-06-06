import { cn } from "@/lib/utils"
import { forwardRef, type HTMLAttributes } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements
  padded?: boolean
}

/**
 * Frosted-glass surface used across the site (project cards, about panel,
 * media containers, etc.). Defaults: dark translucent fill, hairline border,
 * 3xl radius, backdrop blur.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, padded = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-zinc-950/60 backdrop-blur-xl border border-white/10 rounded-3xl",
        padded && "p-8 md:p-10",
        className
      )}
      {...props}
    />
  )
)
GlassCard.displayName = "GlassCard"
