import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex-1 md:flex md:h-screen md:overflow-hidden">
      {/* Desktop sidebar — hidden below md */}
      <DesktopSidebar />

      {/* Center column */}
      <div className="md:flex md:min-w-0 md:flex-1 md:flex-col md:overflow-hidden">
        {/* Mobile sticky topbar — body scrolls on mobile, no inner container */}
        <MobileTopBar />

        {/* Desktop header */}
        <DesktopHeader />

        {/* Content area:
            Mobile — no overflow constraint, body/document scrolls
            Desktop — flex-1 + overflow-y-auto scrolls within fixed-height container */}
        <main className="bg-background px-4 pt-4 md:flex-1 md:overflow-y-auto md:px-6 md:pt-6 md:pb-6">
          {children}
          {/* Spacer reserves space for the fixed mobile bottom nav + iOS safe area.
              Hidden on desktop where the nav is not rendered. */}
          <div
            className="md:hidden"
            aria-hidden="true"
            style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }}
          />
        </main>
      </div>

      {/* Mobile bottom nav — fixed to viewport bottom, out of document flow */}
      <MobileBottomNav />
    </div>
  )
}

/* ======================================================
   Desktop Sidebar (md and above)
   ====================================================== */
function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 flex-col overflow-y-auto bg-nav-bg">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-nav-border px-5">
        <div className="flex items-center gap-2.5">
          <VereonMark />
          <span className="text-[15px] font-semibold tracking-tight text-nav-fg">
            Vereon
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="mb-1 px-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-nav-muted">
          Navigation
        </p>
        <DesktopNavItem href="/dashboard" icon={<DashboardIcon />} label="Übersicht" active />
        <DesktopNavItem href="/dashboard/create-team" icon={<TeamsIcon />} label="Meine Teams" />
      </nav>

      {/* Version footer */}
      <div className="border-t border-nav-border p-3">
        <p className="px-2 text-[11px] text-nav-muted">Vereon V0.1</p>
      </div>
    </aside>
  )
}

interface DesktopNavItemProps {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
}

function DesktopNavItem({ href, icon, label, active }: DesktopNavItemProps) {
  return (
    <a
      href={href}
      className={[
        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
        active
          ? 'bg-nav-item-active text-nav-active-fg'
          : 'text-nav-fg hover:bg-nav-item-hover',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      <span className="flex-shrink-0 opacity-70">{icon}</span>
      {label}
    </a>
  )
}

/* ======================================================
   Desktop Header (md and above)
   ====================================================== */
function DesktopHeader() {
  return (
    <header className="hidden md:flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <ThemeToggle />
    </header>
  )
}

/* ======================================================
   Mobile Top Bar (below md)
   ====================================================== */
function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex md:hidden h-14 items-center justify-between border-b border-nav-border bg-nav-bg px-4">
      <div className="flex items-center gap-2.5">
        <VereonMark />
        <span className="text-[15px] font-semibold tracking-tight text-nav-fg">
          Vereon
        </span>
      </div>
      <ThemeToggle variant="nav" />
    </header>
  )
}

/* ======================================================
   Mobile Bottom Nav (below md)
   ====================================================== */
function MobileBottomNav() {
  return (
    // env(safe-area-inset-bottom) pads the nav above the iOS home indicator.
    // Requires viewport-fit=cover in layout.tsx viewport export.
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t border-nav-border bg-nav-bg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <MobileNavItem href="/dashboard" icon={<DashboardIcon />} label="Übersicht" active />
      <MobileNavItem href="/dashboard/create-team" icon={<TeamsIcon />} label="Teams" />
    </nav>
  )
}

interface MobileNavItemProps {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
}

function MobileNavItem({ href, icon, label, active }: MobileNavItemProps) {
  return (
    <a
      href={href}
      // min-h-[44px] ensures touch target meets Apple HIG / WCAG 2.5.5 minimum
      className={[
        'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[44px]',
        'text-[11px] font-medium transition-colors touch-manipulation',
        active ? 'text-nav-active-fg' : 'text-nav-muted hover:text-nav-fg',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      <span className={active ? '' : 'opacity-60'}>{icon}</span>
      {label}
    </a>
  )
}

/* ======================================================
   Shared icons and mark
   ====================================================== */
function VereonMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect width="22" height="22" rx="5" fill="#16a34a" />
      <path
        d="M6 7l5 8 5-8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function TeamsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
