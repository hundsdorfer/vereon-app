import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { DesktopNavLinks, MobileNavLinks } from './NavLinks'
import { signOutAction } from '@/actions/auth'

interface AppShellProps {
  children: ReactNode
  userEmail?: string
}

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="flex-1 md:flex md:h-screen md:overflow-hidden">
      {/* Desktop sidebar — hidden below md */}
      <DesktopSidebar userEmail={userEmail} />

      {/* Center column */}
      <div className="md:flex md:min-w-0 md:flex-1 md:flex-col md:overflow-hidden">
        {/* Mobile sticky topbar */}
        <MobileTopBar />

        {/* Desktop header */}
        <DesktopHeader />

        {/* Content area:
            Mobile — body scrolls (no overflow constraint)
            Desktop — flex-1 + overflow-y-auto inside fixed-height container */}
        <main className="bg-background px-4 pt-4 md:flex-1 md:overflow-y-auto md:px-6 md:pt-6 md:pb-6">
          {children}
          {/* Spacer: reserves room for fixed mobile bottom nav + iOS safe area */}
          <div
            className="md:hidden"
            aria-hidden="true"
            style={{ height: 'calc(60px + env(safe-area-inset-bottom))' }}
          />
        </main>
      </div>

      {/* Mobile bottom nav — fixed to viewport bottom */}
      <MobileBottomNav />
    </div>
  )
}

/* ======================================================
   Desktop Sidebar (md and above)
   ====================================================== */
function DesktopSidebar({ userEmail }: { userEmail?: string }) {
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

      {/* Nav links (Client Component — reads pathname for active state) */}
      <DesktopNavLinks />

      {/* User info + Logout */}
      <div className="border-t border-nav-border p-3">
        {userEmail && (
          <p
            className="mb-2 px-2 text-[11px] text-nav-muted truncate"
            title={userEmail}
          >
            {userEmail}
          </p>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-nav-muted hover:bg-nav-item-hover hover:text-nav-fg transition-colors touch-manipulation"
          >
            <LogoutIcon />
            Abmelden
          </button>
        </form>
        <p className="mt-2 px-2 text-[11px] text-nav-muted opacity-40">Vereon V0.1</p>
      </div>
    </aside>
  )
}

/* ======================================================
   Desktop Header (md and above)
   ====================================================== */
function DesktopHeader() {
  return (
    <header className="hidden md:flex h-14 flex-shrink-0 items-center justify-end border-b border-border bg-surface px-6">
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
      <div className="flex items-center gap-1">
        <ThemeToggle variant="nav" />
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Abmelden"
            className="flex h-11 w-11 items-center justify-center rounded-md text-nav-muted hover:bg-nav-item-hover hover:text-nav-fg transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-active-fg"
          >
            <LogoutIcon />
          </button>
        </form>
      </div>
    </header>
  )
}

/* ======================================================
   Mobile Bottom Nav (below md)
   ====================================================== */
function MobileBottomNav() {
  return (
    // env(safe-area-inset-bottom) pads above iOS home indicator.
    // Requires viewport-fit=cover in layout.tsx viewport export.
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t border-nav-border bg-nav-bg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* MobileNavLinks is a Client Component — reads pathname for active state */}
      <MobileNavLinks />
    </nav>
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

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
