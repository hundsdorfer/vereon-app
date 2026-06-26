'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

function readDomTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // One-time sync: reads data-theme set by inline script before React hydration.
    // queueMicrotask keeps setState out of the synchronous effect body (ESLint rule).
    queueMicrotask(() => setTheme(readDomTheme()))
  }, [])

  function toggle() {
    // Always read from DOM — avoids stale React state during the initial hydration window.
    const next: Theme = readDomTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('vereon-theme', next) } catch {}
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

/* ======================================================
   ThemeDebug — Phase-A Diagnoseanzeige
   Zeigt alle relevanten Werte für das Theme-System.
   Kann nach Phase A entfernt werden.
   ====================================================== */

interface DebugInfo {
  dataTheme: string
  stored: string
  prefsDark: boolean
  cssBackground: string
  bodyBg: string
}

function readDebugInfo(): DebugInfo {
  return {
    dataTheme: document.documentElement.getAttribute('data-theme') ?? '(fehlt)',
    stored: (() => {
      try { return localStorage.getItem('vereon-theme') ?? 'null' }
      catch { return '(gesperrt – Private Browsing?)' }
    })(),
    prefsDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    cssBackground: getComputedStyle(document.documentElement)
      .getPropertyValue('--background').trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }
}

export function ThemeDebug() {
  const { theme } = useTheme()
  const [info, setInfo] = useState<DebugInfo | null>(null)

  useEffect(() => {
    // queueMicrotask: ensures computed styles are read AFTER CSS cascade has settled
    // and keeps setState out of the synchronous effect body.
    queueMicrotask(() => {
      try { setInfo(readDebugInfo()) } catch {}
    })
  }, [theme])

  return (
    <div className="rounded-md border border-border bg-surface-muted px-3 py-2.5 text-xs font-mono">
      <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Theme-Diagnose
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-0.5">
        <dt className="text-muted-foreground">React&nbsp;theme</dt>
        <dd className="text-foreground">{theme}</dd>

        {info ? (
          <>
            <dt className="text-muted-foreground">data-theme</dt>
            <dd className="text-foreground">{info.dataTheme}</dd>

            <dt className="text-muted-foreground">localStorage</dt>
            <dd className="text-foreground">{info.stored}</dd>

            <dt className="text-muted-foreground">prefers&nbsp;dark</dt>
            <dd className="text-foreground">{String(info.prefsDark)}</dd>

            <dt className="text-muted-foreground">--background</dt>
            <dd className="truncate text-foreground">{info.cssBackground}</dd>

            <dt className="text-muted-foreground">body&nbsp;bg</dt>
            <dd className="truncate text-foreground">{info.bodyBg}</dd>
          </>
        ) : (
          <dd className="col-span-2 text-muted-foreground">Lädt…</dd>
        )}
      </dl>
    </div>
  )
}
