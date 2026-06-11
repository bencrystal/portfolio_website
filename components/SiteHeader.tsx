'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: ReactNode
  /** internal Next link vs external anchor */
  external?: boolean
  /** If set, this entry highlights as active when the current path starts with it. */
  matchPath?: string
}

const MusicIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3zm12-3c0 1.657-1.79 3-4 3s-4-1.343-4-3 1.79-3 4-3 4 1.343 4 3z" />
  </svg>
)

const DefineIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <text
      x="2"
      y="18"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="16"
      letterSpacing="-0.5"
    >
      Aa
    </text>
  </svg>
)

const ResumeIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const LinkedInIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const GitHubIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  { label: 'Music', href: '/music', icon: MusicIcon, matchPath: '/music' },
  { label: 'Define', href: '/define', icon: DefineIcon, matchPath: '/define' },
  { label: 'Resume', href: '/Resume_BenCrystal.pdf', icon: ResumeIcon, external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ben-crystal/', icon: LinkedInIcon, external: true },
  { label: 'GitHub', href: 'https://github.com/bencrystal', icon: GitHubIcon, external: true },
]

const NavLink = ({ item, active }: { item: NavItem; active: boolean }) => {
  const className = cn(
    'flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold transition-colors',
    active ? 'text-[#57f1ff]' : 'text-zinc-400 hover:text-white'
  )
  const inner = (
    <>
      {item.icon}
      <span className="hidden sm:inline">{item.label}</span>
      <span className="sr-only sm:hidden">{item.label}</span>
    </>
  )

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  )
}

export const SiteHeader = () => {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-sm border-b border-white/10">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-white transition-colors hover:text-[#57f1ff]"
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: '#57f1ff' }}
            />
            Ben Crystal
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={Boolean(item.matchPath && pathname?.startsWith(item.matchPath))}
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
