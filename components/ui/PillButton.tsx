import { cn } from "@/lib/utils"
import Link from "next/link"
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react"

type Variant = "ghost" | "gradient"
type Size = "sm" | "md" | "lg"

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out backdrop-blur-xl"

const variants: Record<Variant, string> = {
  ghost:
    "bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/[0.2] text-white",
  gradient:
    "border border-white/10 text-white overflow-hidden",
}

const sizes: Record<Size, string> = {
  sm: "px-5 py-2 text-sm",
  md: "px-8 py-3 text-sm",
  lg: "px-10 py-4 text-base",
}

interface PillBaseProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

/** Gradient hover layer for the gradient variant. */
const GradientLayer = ({ visible }: { visible: boolean }) =>
  visible ? (
    <>
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 group-hover:from-cyan-500/50 group-hover:to-blue-600/50 transition-all duration-300" />
      <span className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-300" />
    </>
  ) : null

type PillButtonProps = PillBaseProps & ButtonHTMLAttributes<HTMLButtonElement>

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ variant = "ghost", size = "md", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      <GradientLayer visible={variant === "gradient"} />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  )
)
PillButton.displayName = "PillButton"

type PillLinkProps = PillBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string
    external?: boolean
  }

export const PillLink = forwardRef<HTMLAnchorElement, PillLinkProps>(
  ({ variant = "ghost", size = "md", className, children, href, external, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className)
    const inner = (
      <>
        <GradientLayer visible={variant === "gradient"} />
        <span className="relative flex items-center gap-2">{children}</span>
      </>
    )
    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          {...props}
        >
          {inner}
        </a>
      )
    }
    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {inner}
      </Link>
    )
  }
)
PillLink.displayName = "PillLink"
