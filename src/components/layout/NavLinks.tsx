'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Übersicht',    icon: <DashboardIcon /> },
  { href: '/teams',     label: 'Meine Teams',  icon: <TeamsIcon /> },
] as const

function active(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

/* Desktop Sidebar-Navigation */
export function DesktopNavLinks() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <p className="mb-1 px-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-nav-muted">
        Navigation
      </p>
      {NAV_ITEMS.map(item => {
        const isActive = active(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-nav-item-active text-nav-active-fg'
                : 'text-nav-fg hover:bg-nav-item-hover',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="flex-shrink-0 opacity-70">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/* Mobile Bottom-Navigation */
export function MobileNavLinks() {
  const pathname = usePathname()
  return (
    <>
      {NAV_ITEMS.map(item => {
        const isActive = active(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[44px]',
              'text-[11px] font-medium transition-colors touch-manipulation',
              isActive ? 'text-nav-active-fg' : 'text-nav-muted hover:text-nav-fg',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={isActive ? '' : 'opacity-60'}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

/* ── Icons ── */

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function TeamsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
