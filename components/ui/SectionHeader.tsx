import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SectionHeaderProps {
  children: ReactNode
  eyebrow?: string
  align?: "left" | "center"
  divider?: boolean
  className?: string
}

/**
 * Section title with optional eyebrow and gradient hairline divider.
 * Used between project categories and across content sections.
 */
export const SectionHeader = ({
  children,
  eyebrow,
  align = "center",
  divider = true,
  className,
}: SectionHeaderProps) => (
  <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
    {eyebrow && (
      <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
        {eyebrow}
      </p>
    )}
    <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
      {children}
    </h2>
    {divider && (
      <div
        className={cn(
          "w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80 mt-6",
          align === "center" && "mx-auto"
        )}
      />
    )}
  </div>
)
